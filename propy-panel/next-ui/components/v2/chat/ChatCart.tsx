import {Link, User} from "@heroui/react";

export default function ChatCart(){
      return (
          <div className={"rtl"}>
              <div className={"flex"}>
                  <div>
                      <User
                          avatarProps={{
                              src: "https://avatars.githubusercontent.com/u/30373425?v=4",
                          }}
                          description={
                              <Link isExternal href="https://x.com/jrgarciadev" size="sm">
                                  @jrgarciadev
                              </Link>
                          }
                          name="Junior Garcia"
                      />
                  </div>

                  <div>
                      <span>
                          active
                      </span>
                      <span>
                          ticket id
                      </span>

                  </div>

              </div>
              <div>

                  <h4> subject </h4>

                  <p>
                      body
                  </p>


              </div>


          </div>

    );
}