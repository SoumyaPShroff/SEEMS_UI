const MyTeam = () => {
  return (
    <>
      <h2>My Team</h2>
      <table style={{ width: "100%", marginTop: "16px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Employee ID</th>
            <th>Designation</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jane Doe</td>
            <td>ECAD1045</td>
            <td>Engineer</td>
            <td>jane@ecad.com</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default MyTeam;
