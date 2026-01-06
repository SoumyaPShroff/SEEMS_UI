import ToggleView from "../../components/resusablecontrols/ToggleView";
import OnsiteEnquiry from "./OnsiteEnquiry";
import OffshoreEnquiry from "./OffshoreEnquiry";

const AddEnquiry = () => {
  return (
    <ToggleView
      defaultValue="OFFSHORE"
      options={[
        { label: "ONSITE", value: "ONSITE" },
        { label: "OFFSHORE", value: "OFFSHORE" },
      ]}
      renderMap={{
        ONSITE: <OnsiteEnquiry />,
        OFFSHORE: <OffshoreEnquiry />,
      }}
    />
  );
};

export default AddEnquiry;