import { useNavigate } from "react-router-dom";
const Blank: React.FC = () => {
    const navigate = useNavigate();

    const handleRedirect = () => {
        navigate("/Home");
    };

    return (
        <div>
            <h2>Sorry! You do not have access to this page.</h2>
            <button onClick={handleRedirect}>
                Go to Home
            </button>
        </div>
    );
};

export default Blank;