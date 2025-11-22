/**
 * Client Docker simplifié
 */

import Dockerode from 'dockerode';

const docker = new Dockerode({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
});

export default docker;
