import SwitchToggleView from "../../components/resusablecontrols/SwitchToggleView";
import OnsiteEnquiry from "./OnsiteEnquiry";
import OffshoreEnquiry from "./OffshoreEnquiry";

const AddEnquiry = () => {
  return (
    <SwitchToggleView
      defaultValue="OFFSHORE"
      hideHeader  // hides the title if not needed to show
      containerSx={{ mt: 15 }}
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
  );
};

export default AddEnquiry;
