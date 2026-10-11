import Queue from 'bull';
import nodemailer from 'nodemailer';
import { config } from '../config';

interface MailJob {
    to: string;
    subject: string;
    text: string;
}

const transport = config.mail.host
    ? nodemailer.createTransport({
          host: config.mail.host,
          port: config.mail.port,
          secure: config.mail.port === 465,
          auth: config.mail.user ? { user: config.mail.user, pass: config.mail.password } : undefined,
      })
    : null;

export const mailQueue = new Queue<MailJob>('mail', config.redisUrl);

mailQueue.process(async (job) => {
    const { to, subject, text } = job.data;
    if (!transport) {
        console.log(`[mail:console] to=${to} subject="${subject}"\n${text}\n`);
        return;
    }
    await transport.sendMail({ from: config.mail.from, to, subject, text });
});

mailQueue.on('failed', (job, err) => console.error(`[mail] failed to send to ${job.data.to}:`, err.message));

export function sendMail(to: string, subject: string, text: string) {
    return mailQueue.add({ to, subject, text }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true });
}

export function notifyAdmins(subject: string, text: string) {
    if (!config.mail.adminNotify) {
        console.log(`[admin-notify] ${subject}: ${text}`);
        return;
    }
    return sendMail(config.mail.adminNotify, subject, text);
}
