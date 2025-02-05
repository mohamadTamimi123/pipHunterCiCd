import { createClient } from 'redis';




// const value = await client.get('key');



export async function getOtpRedis__Unit(user_id:any ){
    const client = await createClient({})
        .on('error', err => console.log('Redis Client Error', err))
        .connect();

    const otp = await client.get(user_id);

    await client.disconnect();
    return otp
}