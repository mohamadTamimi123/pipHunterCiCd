
import { Divider } from "@heroui/divider";
import Spline from "@splinetool/react-spline";
import style from "@/styles/authNew.module.scss"
import Image from "next/image";
interface Props {
  children: React.ReactNode;
}

export const AuthLayoutWrapper = ({ children }: Props) => {
  return (
      <div className='flex h-screen '>

          <div className='hidden md:flex flex-1 relative flex items-end justify-center p-6 pb-24'>
              <div className={`absolute left-0 right-0 bottom-0 top-0 z-0 ${style.main_anim_sec}`}>

                  <Spline
                      scene="https://prod.spline.design/jV5f5mSf6fSu4exb/scene.splinecode"
                  />
              </div>


              <div className='z-10'>
                  <h1 className='font-bold text-black text-[45px]'>لورم</h1>
                  <div className='font-light text-black mt-4'>
                      لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ
                  </div>
              </div>
          </div>


          <div className='flex-1  flex-col flex items-center justify-center p-6'>
              <div className='md:hidden absolute left-0 right-0 bottom-0 top-0 z-0'>
                  <Image
                      width={600}
                      className='w-full h-full'
                      src='https://nextui.org/gradients/docs-right.png'
                      alt='gradient'
                      height={800}
                  />
              </div>
              {children}
          </div>


      </div>
  );
};
