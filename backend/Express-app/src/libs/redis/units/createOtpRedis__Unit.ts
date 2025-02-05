import { createClient } from 'redis';




// const value = await client.get('key');



export async function createOtpRedis__Unit(user_id:any  ,val : string){
    const client = await createClient({})
        .on('error', err => console.log('Redis Client Error', err))
        .connect();
    console.log("start")
    console.log(user_id)
    console.log(val)
    await client.set(`U_${user_id}`,  val);

    await client.disconnect();
}