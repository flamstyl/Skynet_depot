/**
 * Sentinelle MCP - Notifications Tool
 * Handles sending notifications via various channels
 */

const axios = require('axios');

/**
 * Send notification
 *
 * @param {Object} notification - Notification data
 * @param {Object} config - Server configuration
 * @returns {Promise<Object>} Result
 */
async function sendNotification(notification, config) {
    const methods = [];
    const results = [];

    const notifConfig = config.notifications;

    // Check if notifications are enabled
    if (!notifConfig.notify_raphael) {
        return {
            sent: false,
            methods: [],
            message: 'Notifications are disabled'
        };
    }

    // Try webhook
    if (notifConfig.methods.webhook?.enabled) {
        try {
            const webhookResult = await sendWebhook(notification, notifConfig.methods.webhook);
            methods.push('webhook');
            results.push(webhookResult);
        } catch (error) {
            console.error('Webhook notification failed:', error.message);
        }
    }

    // Try email
    if (notifConfig.methods.email?.enabled) {
        try {
            const emailResult = await sendEmail(notification, notifConfig.methods.email);
            methods.push('email');
            results.push(emailResult);
        } catch (error) {
            console.error('Email notification failed:', error.message);
        }
    }

    // Try Telegram
    if (notifConfig.methods.telegram?.enabled) {
        try {
            const telegramResult = await sendTelegram(notification, notifConfig.methods.telegram);
            methods.push('telegram');
            results.push(telegramResult);
        } catch (error) {
            console.error('Telegram notification failed:', error.message);
        }
    }

    // Console notification (always enabled for dev)
    console.log('\n' + '='.repeat(60));
    console.log('📬 NOTIFICATION');
    console.log('='.repeat(60));
    console.log(JSON.stringify(notification, null, 2));
    console.log('='.repeat(60) + '\n');

    return {
        sent: methods.length > 0,
        methods,
        results,
        timestamp: new Date().toISOString()
    };
}

/**
 * Send webhook notification
 *
 * @param {Object} notification - Notification data
 * @param {Object} config - Webhook configuration
 * @returns {Promise<Object>} Result
 */
async function sendWebhook(notification, config) {
    const { url, headers } = config;

    if (!url) {
        throw new Error('Webhook URL not configured');
    }

    try {
        const response = await axios.post(url, notification, {
            headers: headers || {},
            timeout: 5000
        });

        return {
            success: true,
            method: 'webhook',
            status: response.status,
            message: 'Webhook sent successfully'
        };

    } catch (error) {
        return {
            success: false,
            method: 'webhook',
            error: error.message
        };
    }
}

/**
 * Send email notification
 *
 * @param {Object} notification - Notification data
 * @param {Object} config - Email configuration
 * @returns {Promise<Object>} Result
 */
async function sendEmail(notification, config) {
    // TODO: Implement email sending using nodemailer
    // For now, just log

    const { smtp_host, smtp_port, from, to } = config;

    if (!smtp_host || !to || to.length === 0) {
        throw new Error('Email configuration incomplete');
    }

    // Placeholder implementation
    console.log(`[EMAIL] Would send to: ${to.join(', ')}`);
    console.log(`[EMAIL] Subject: Sentinelle Alert - ${notification.event?.type || 'Notification'}`);
    console.log(`[EMAIL] Body: ${JSON.stringify(notification, null, 2)}`);

    return {
        success: true,
        method: 'email',
        message: 'Email sent (placeholder)',
        recipients: to
    };
}

/**
 * Send Telegram notification
 *
 * @param {Object} notification - Notification data
 * @param {Object} config - Telegram configuration
 * @returns {Promise<Object>} Result
 */
async function sendTelegram(notification, config) {
    const { bot_token, chat_id } = config;

    if (!bot_token || !chat_id) {
        throw new Error('Telegram configuration incomplete');
    }

    try {
        // Format message
        const message = formatTelegramMessage(notification);

        // Send via Telegram Bot API
        const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;

        const response = await axios.post(url, {
            chat_id,
            text: message,
            parse_mode: 'Markdown'
        }, {
            timeout: 5000
        });

        return {
            success: true,
            method: 'telegram',
            message: 'Telegram message sent',
            message_id: response.data.result.message_id
        };

    } catch (error) {
        return {
            success: false,
            method: 'telegram',
            error: error.message
        };
    }
}

/**
 * Format notification for Telegram
 *
 * @param {Object} notification - Notification data
 * @returns {string} Formatted message
 */
function formatTelegramMessage(notification) {
    let message = '🟣 *Sentinelle MCP Alert*\n\n';

    if (notification.type === 'alert') {
        message += `⚠️ *${notification.priority.toUpperCase()}*\n\n`;
        message += `${notification.message}\n\n`;
        message += `_${notification.timestamp}_`;
        return message;
    }

    // Event notification
    if (notification.event) {
        const { event } = notification;

        message += `📁 *Event:* ${event.type}\n`;
        message += `📄 *File:* \`${event.file}\`\n`;
        message += `🏷️ *Category:* ${event.category}\n`;
        message += `⚡ *Priority:* ${event.priority}\n\n`;

        if (notification.ai_summary) {
            message += `💡 *AI Analysis:*\n${notification.ai_summary}\n\n`;
        }

        if (notification.recommendations && notification.recommendations.length > 0) {
            message += `📋 *Recommendations:*\n`;
            notification.recommendations.forEach((rec, idx) => {
                message += `${idx + 1}. ${rec}\n`;
            });
            message += '\n';
        }

        message += `_${notification.timestamp}_`;
    }

    return message;
}

/**
 * Format notification for email
 *
 * @param {Object} notification - Notification data
 * @returns {Object} Email subject and body
 */
function formatEmailNotification(notification) {
    let subject = 'Sentinelle MCP Alert';
    let body = '';

    if (notification.type === 'alert') {
        subject = `Sentinelle Alert [${notification.priority.toUpperCase()}]`;
        body = `
Priority: ${notification.priority}
Message: ${notification.message}
Timestamp: ${notification.timestamp}

${JSON.stringify(notification.data, null, 2)}
        `;
        return { subject, body };
    }

    // Event notification
    if (notification.event) {
        const { event } = notification;

        subject = `Sentinelle Event: ${event.type} - ${event.file}`;

        body = `
Event Type: ${event.type}
File: ${event.file}
Path: ${event.path}
Category: ${event.category}
Priority: ${event.priority}
Timestamp: ${notification.timestamp}

`;

        if (notification.ai_summary) {
            body += `\nAI Analysis:\n${notification.ai_summary}\n`;
        }

        if (notification.recommendations && notification.recommendations.length > 0) {
            body += '\nRecommendations:\n';
            notification.recommendations.forEach((rec, idx) => {
                body += `${idx + 1}. ${rec}\n`;
            });
        }
    }

    return { subject, body };
}

module.exports = {
    sendNotification,
    sendWebhook,
    sendEmail,
    sendTelegram,
    formatTelegramMessage,
    formatEmailNotification
};
