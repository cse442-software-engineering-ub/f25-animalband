import { HashRouter, Routes, Route } from "react-router-dom";
import useIsMobile from "../hook/useIsMobile.js";
import MobileLanding from "./routes/landing/mobile_landing.js"
import DesktopLanding from "./routes/landing/desktop_landing.js";
import Forum from "./routes/forum/forum.js";
import Looping from "./routes/looping/looping.js";
import Stage from "./routes/stage/stage.js";
import Register from "./routes/register/desktop_register.js";
import Login from "./routes/login/desktop_login.js";
import Account from "./routes/account/desktop_account.js";
import PwdCode from "./routes/login/desktop_pwd_code.js"
import "../App.css";

function NotFound() {
  return <h2>404 – Page not found</h2>;
}
function Landing(){
  const isMobile = useIsMobile(852);
  return isMobile ? <MobileLanding /> : <DesktopLanding />;
}

export default function App() {
  return (
    <HashRouter>
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/stage" element={<Stage />} />
          <Route path="/looping" element={<Looping />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/password-code" element={<PwdCode />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
