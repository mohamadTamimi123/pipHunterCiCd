import crypto from 'crypto';
import { redis } from './redis';
import { sendMail } from './mailer';

const TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;

const codeKey = (userId: number) => `otp:${userId}`;
const attemptsKey = (userId: number) => `otp:attempts:${userId}`;

export async function issueOtp(userId: number, email: string) {
    const code = String(crypto.randomInt(1000, 10000));
    await redis.set(codeKey(userId), code, { EX: TTL_SECONDS });
    await redis.del(attemptsKey(userId));
    await sendMail(email, 'کد تایید پیپ‌هانتر', `کد تایید شما: ${code}\nاین کد تا ۱۰ دقیقه معتبر است.`);
    return code;
}

export async function verifyOtp(userId: number, code: string): Promise<boolean> {
    const attempts = await redis.incr(attemptsKey(userId));
    await redis.expire(attemptsKey(userId), TTL_SECONDS);
    if (attempts > MAX_ATTEMPTS) return false;

    const stored = await redis.get(codeKey(userId));
    if (!stored || stored !== code) return false;
    await redis.del([codeKey(userId), attemptsKey(userId)]);
    return true;
}
