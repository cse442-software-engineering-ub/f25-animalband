import { HashRouter, Routes, Route } from "react-router-dom";
import useIsMobile from "../hook/useIsMobile.js";

import MobileLanding from "./routes/landing/mobile_landing.js"
import DesktopLanding from "./routes/landing/desktop_landing.js";

import DesktopStage from "./routes/stage/decktop_stage.js";
import MobileStage from "./routes/stage/mobile_stage.js";

import Looping from "./routes/looping/looping.js";

import Register from "./routes/register/desktop_register.js";
import Login from "./routes/login/desktop_login.js";

import DesktopProfile from "./routes/account/desktop_profile.js";
import MobileProfile from "./routes/account/mobile_profile.js";

import DesktopEditAccount from "./routes/account/desktop_edit_account.js";
import MobileEditAccount from "./routes/account/mobile_edit_account.js";

import DesktopForum from "./routes/forum/desktop_forum.js";
import MobileForum from "./routes/forum/mobile_forum.js";

import PwdCode from "./routes/login/desktop_pwd_code.js"
import ResetPwd from "./routes/login/desktop_pwd_reset.js";
import ResetEmail from "./routes/login/desktop_reset_email.js";

import MyRecordings from "./routes/account/recordings.js";

import "../App.css";

function NotFound() {
  return <h2>404 – Page not found</h2>;
}
function Landing(){
  const isMobile = useIsMobile(852);
  return isMobile ? <MobileLanding /> : <DesktopLanding />;
}
function Account(){
  const isMobile = useIsMobile(852);
  return isMobile ? <MobileProfile /> : <DesktopProfile />;
}
function EditAccount(){
  const isMobile = useIsMobile(852);
  return isMobile ? <MobileEditAccount /> : <DesktopEditAccount />;
}

function Forum(){
  const isMobile = useIsMobile(852);
  return isMobile ? <MobileForum /> : <DesktopForum />;
}
function Stage(){
  const isMobile = useIsMobile(852);
  return isMobile ? <MobileStage /> : <DesktopStage />;
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
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/password-code" element={<PwdCode />} />
          <Route path="/reset-password" element={<ResetPwd />} />
          <Route path="/forgot-password" element={<PwdCode />} />
          <Route path="/account-email" element={<ResetEmail />} />
          <Route path="/account/edit" element={<EditAccount />} />
          <Route path="/my-recordings" element={<MyRecordings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
