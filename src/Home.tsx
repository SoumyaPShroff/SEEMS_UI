
import Sidebar from "./components/Sidebar";
import { Outlet } from "react-router-dom";

const Home: React.FC<HomeProps> = ({ userId, setUserId }) => {

  if (!userId) return null;

  return (
    <>
      <Sidebar
        sessionUserID={userId}
        setUserId={setUserId}
      />

      {/* Child routes render here */}
      <Outlet />
    </>
  );
};

export default Home;
