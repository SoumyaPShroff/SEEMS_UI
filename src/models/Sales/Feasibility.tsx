// // // import { useEffect, useState } from "react";
// // // import axios from "axios";
// // // import { useParams, useNavigate } from "react-router-dom";

 export default function Feasibility() {
  return null;
//   const { enquiryno } = useParams();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     capability: "",
//     capabilityRks: "",
//     density: "",
//     densityRks: "",
//     timeline: "",
//     timelineRks: "",
//     cost: "",
//     costRks: "",
//     resource: "",
//     resourceRks: "",
//     license: "",
//     licenseRks: ""
//   });

//   useEffect(() => {
//     axios.get(`/api/feasibility/${enquiryno}`)
//       .then(res => {
//         if (res.data) setForm(res.data);
//       });
//   }, [enquiryno]);

//   const handleChange = e => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = () => {
//     axios.post("/api/feasibility", {
//       ...form,
//       enqNo: enquiryno
//     }).then(() => {
//       navigate(`/add-estimation/${enquiryno}`);
//     });
//   };

//   return (
//     <div>
//       <h2>Feasibility Validation</h2>
//       <select name="capability" value={form.capability} onChange={handleChange}>
//         <option value="">Select</option>
//         <option value="High">High</option>
//         <option value="Medium">Medium</option>
//         <option value="Low">Low</option>
//       </select>
//       <input
//         name="capabilityRks"
//         value={form.capabilityRks}
//         onChange={handleChange}
//         placeholder="Capability Risks"
//       />
//       {/* Repeat for Density, Timeline, Cost, Resource, License */}
//       <button onClick={handleSubmit}>Save</button>
//     </div>
 // );
}
