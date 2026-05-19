import SwitchToggleView from "../../components/resusablecontrols/SwitchToggleView";
import OnsiteEnquiry from "./OnsiteEnquiry";
import OffshoreEnquiry from "./OffshoreEnquiry";
import { Link } from "react-router-dom";

const AddEnquiry = () => {
  return (
    <>
      <div style={{   marginLeft: "18px" }}>
        <Link to="/Home/ViewAllEnquiries">View All Enquiries</Link>
      </div>
      <SwitchToggleView
        defaultValue="OFFSHORE"
        hideHeader  // hides the title if not needed to show
        options={[
          {
            label: "ONSITE",
            value: "ONSITE",
          },
          {
            label: "OFFSHORE",
            value: "OFFSHORE",
          },
        ]}
        renderMap={{
          ONSITE: <OnsiteEnquiry />,
          OFFSHORE: <OffshoreEnquiry />,
        }}
      />
    </>
  );
};

export default AddEnquiry;
