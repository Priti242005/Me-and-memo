import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");

    console.log("TOKEN:", token); // DEBUG

    if (token) {
      localStorage.setItem("token", token);
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [search, navigate]);

  return (
    <div style={{ color: "white", fontSize: "30px" }}>
      OAuth Loading...
    </div>
  );
}