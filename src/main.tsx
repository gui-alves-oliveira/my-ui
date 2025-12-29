import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Menu } from "./components/menu";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="h-screen w-screen flex justify-center items-center">
      <Menu>
        <Menu.Trigger className="bg-purple-500 px-2 h-8 rounded text-white">
          My Menu
        </Menu.Trigger>

        <Menu.Popover className="border p-2 rounded bg-white flex flex-col">
          <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
            Sub item 1
          </Menu.Item>
          <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
            Sub item 2
          </Menu.Item>
          <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
            Sub item 3
          </Menu.Item>

          <Menu.Sub>
            <Menu.SubTrigger className="hover:bg-purple-500 h-8 px-2 rounded">
              Teste
            </Menu.SubTrigger>

            <Menu.Popover className="border p-2 rounded bg-white flex flex-col">
              <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
                Sub item 1
              </Menu.Item>
              <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
                Sub item 2
              </Menu.Item>
              <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
                Sub item 3
              </Menu.Item>

              <Menu.Sub>
                <Menu.SubTrigger className="hover:bg-purple-500 h-8 px-2 rounded">
                  Teste
                </Menu.SubTrigger>

                <Menu.Popover className="border p-2 rounded bg-white flex flex-col">
                  <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
                    Sub item 1
                  </Menu.Item>
                  <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
                    Sub item 2
                  </Menu.Item>
                  <Menu.Item className="hover:bg-purple-500 h-8 px-2 rounded">
                    Sub item 3
                  </Menu.Item>
                </Menu.Popover>
              </Menu.Sub>
            </Menu.Popover>
          </Menu.Sub>
        </Menu.Popover>
      </Menu>
    </div>
  </StrictMode>,
);
