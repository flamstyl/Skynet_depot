/**
 * Docker Runner Service
 * Manages Docker container execution for code sandboxing
 */

import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import logger from './logger.js';

class DockerRunner {
    constructor() {
        this.docker = new Docker();
        this.imageName = 'devbox:latest';
        this.containers = new Map();
        this.workspaceDir = path.resolve('../workspace');
    }

    async init() {
        try {
            // Check Docker connection
            await this.docker.ping();
            logger.info('✓ Docker connection established');

            // Ensure workspace directory exists
            await fs.ensureDir(this.workspaceDir);
            await fs.ensureDir(path.join(this.workspaceDir, 'input'));
            await fs.ensureDir(path.join(this.workspaceDir, 'output'));

            // Check if devbox image exists, if not build it
            const images = await this.docker.listImages();
            const hasImage = images.some(img =>
                img.RepoTags && img.RepoTags.includes(this.imageName)
            );

            if (!hasImage) {
                logger.warn(`Image ${this.imageName} not found. Building...`);
                await this.buildImage();
            }

        } catch (error) {
            logger.error('Docker initialization failed:', error);
            throw error;
        }
    }

    async buildImage() {
        // TODO: Build the devbox Docker image from Dockerfile
        logger.info('Building devbox image...');
        const dockerfilePath = path.resolve('../docker');

        try {
            const stream = await this.docker.buildImage({
                context: dockerfilePath,
                src: ['Dockerfile', 'entrypoint.sh']
            }, {
                t: this.imageName
            });

            await new Promise((resolve, reject) => {
                this.docker.modem.followProgress(stream, (err, res) =>
                    err ? reject(err) : resolve(res)
                );
            });

            logger.info('✓ Docker image built successfully');
        } catch (error) {
            logger.error('Failed to build Docker image:', error);
            throw error;
        }
    }

    async execute(code, language, options = {}) {
        const runId = uuidv4();
        const startTime = Date.now();

        logger.info(`Starting execution ${runId} (${language})`);

        try {
            // Prepare files
            const inputDir = path.join(this.workspaceDir, 'input');
            const outputDir = path.join(this.workspaceDir, 'output');
            await fs.emptyDir(inputDir);
            await fs.emptyDir(outputDir);

            // Write code to file
            const { filename, command } = this.getLanguageConfig(language, code);
            await fs.writeFile(path.join(inputDir, filename), code);

            // Write additional files if provided
            if (options.files) {
                for (const [name, content] of Object.entries(options.files)) {
                    await fs.writeFile(path.join(inputDir, name), content);
                }
            }

            // Create container
            const container = await this.createContainer(runId, command, options);
            this.containers.set(runId, container);

            // Start container
            await container.start();
            logger.info(`Container ${container.id.substring(0, 12)} started`);

            // Wait for execution
            const { exitCode, stdout, stderr } = await this.waitForContainer(
                container,
                options.timeout || 30000
            );

            // Cleanup
            await container.remove({ force: true });
            this.containers.delete(runId);

            const duration = Date.now() - startTime;

            logger.info(`Execution ${runId} completed (exit: ${exitCode}, duration: ${duration}ms)`);

            return {
                runId,
                success: exitCode === 0,
                exitCode,
                stdout,
                stderr,
                duration,
                containerInfo: {
                    id: container.id,
                    image: this.imageName
                }
            };

        } catch (error) {
            logger.error(`Execution ${runId} failed:`, error);
            throw error;
        }
    }

    async createContainer(runId, command, options = {}) {
        const containerConfig = {
            Image: this.imageName,
            Cmd: ['/bin/bash', '-c', command],
            WorkingDir: '/workspace',
            Env: this.buildEnvVars(options.env || {}),
            HostConfig: {
                Binds: [
                    `${this.workspaceDir}:/workspace:rw`
                ],
                Memory: options.memory || 4 * 1024 * 1024 * 1024, // 4GB
                NanoCpus: (options.cpus || 2) * 1e9,
                NetworkMode: options.network || 'bridge',
                ReadonlyRootfs: false,
                AutoRemove: false
            },
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            Labels: {
                'devbox.runId': runId,
                'devbox.timestamp': new Date().toISOString()
            }
        };

        const container = await this.docker.createContainer(containerConfig);
        logger.info(`Container ${container.id.substring(0, 12)} created`);

        return container;
    }

    async waitForContainer(container, timeout = 30000) {
        return new Promise(async (resolve, reject) => {
            const timeoutHandle = setTimeout(async () => {
                logger.warn(`Container ${container.id.substring(0, 12)} timed out`);
                try {
                    await container.kill();
                    await container.remove({ force: true });
                } catch (e) {
                    logger.error('Failed to kill timed out container:', e);
                }
                reject(new Error('Execution timeout'));
            }, timeout);

            try {
                // Attach to get logs
                const stream = await container.attach({
                    stream: true,
                    stdout: true,
                    stderr: true
                });

                let stdout = '';
                let stderr = '';

                stream.on('data', (chunk) => {
                    const str = chunk.toString('utf-8');
                    // Docker multiplexes stdout/stderr with 8-byte headers
                    const type = chunk[0];
                    const data = chunk.slice(8);

                    if (type === 1) {
                        stdout += data.toString('utf-8');
                    } else if (type === 2) {
                        stderr += data.toString('utf-8');
                    }
                });

                // Wait for container to finish
                const result = await container.wait();
                clearTimeout(timeoutHandle);

                resolve({
                    exitCode: result.StatusCode,
                    stdout,
                    stderr
                });

            } catch (error) {
                clearTimeout(timeoutHandle);
                reject(error);
            }
        });
    }

    getLanguageConfig(language, code) {
        const configs = {
            python: {
                filename: 'main.py',
                command: 'cd /workspace/input && python3 main.py'
            },
            javascript: {
                filename: 'main.js',
                command: 'cd /workspace/input && node main.js'
            },
            typescript: {
                filename: 'main.ts',
                command: 'cd /workspace/input && npx ts-node main.ts'
            },
            java: {
                filename: 'Main.java',
                command: 'cd /workspace/input && javac Main.java && java Main'
            },
            rust: {
                filename: 'main.rs',
                command: 'cd /workspace/input && rustc main.rs -o main && ./main'
            },
            go: {
                filename: 'main.go',
                command: 'cd /workspace/input && go run main.go'
            },
            cpp: {
                filename: 'main.cpp',
                command: 'cd /workspace/input && g++ main.cpp -o main && ./main'
            },
            c: {
                filename: 'main.c',
                command: 'cd /workspace/input && gcc main.c -o main && ./main'
            },
            csharp: {
                filename: 'Program.cs',
                command: 'cd /workspace/input && csc Program.cs && mono Program.exe'
            }
        };

        return configs[language] || configs.python;
    }

    buildEnvVars(envVars) {
        const defaults = {
            DEBIAN_FRONTEND: 'noninteractive',
            PYTHONUNBUFFERED: '1',
            NODE_ENV: 'development'
        };

        return Object.entries({ ...defaults, ...envVars }).map(
            ([key, value]) => `${key}=${value}`
        );
    }

    async exec(containerId, command) {
        try {
            const container = this.docker.getContainer(containerId);

            const exec = await container.exec({
                Cmd: ['/bin/bash', '-c', command],
                AttachStdout: true,
                AttachStderr: true
            });

            const stream = await exec.start();

            let output = '';
            stream.on('data', (chunk) => {
                output += chunk.toString('utf-8').slice(8); // Skip header
            });

            await new Promise((resolve, reject) => {
                stream.on('end', resolve);
                stream.on('error', reject);
            });

            return { stdout: output, stderr: '', exitCode: 0 };

        } catch (error) {
            logger.error('Exec failed:', error);
            throw error;
        }
    }

    async cleanup() {
        logger.info('Cleaning up Docker containers...');

        for (const [runId, container] of this.containers.entries()) {
            try {
                await container.kill();
                await container.remove({ force: true });
                logger.info(`Container ${runId} cleaned up`);
            } catch (error) {
                logger.error(`Failed to cleanup container ${runId}:`, error);
            }
        }

        this.containers.clear();
    }

    getStatus() {
        return {
            connected: true,
            image: this.imageName,
            activeContainers: this.containers.size
        };
    }

    async listContainers() {
        return await this.docker.listContainers({
            all: true,
            filters: { label: ['devbox.runId'] }
        });
    }
}

export default DockerRunner;
