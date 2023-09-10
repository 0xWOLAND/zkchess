import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import "./home.css";
import Tooltip from "../components/Tooltip";
import Button from "../components/Button";
import Compose from "../components/Compose";
import Queue from "../components/Queue";
import { SERVER } from "../config";
import MessageCell from "../components/MessageCell";

import state from "../contexts/state";

export default observer(() => {
  const { ui, user, msg, auth, game } = React.useContext(state);
  const [showingCreatePopup, setShowingCreatePopup] = React.useState(false);
  const navigate = useNavigate();

  return (
    <div className="container">
      <div>ZK Chess!</div>
      <button
        type="button"
        onClick={async () => {
          setShowingCreatePopup(true)
        }}
      >
        Play!
      </button>
      {showingCreatePopup ? (
        <Queue onDone={() => setShowingCreatePopup(false)} />
      ) : null}
      <div style={{ flex: 1 }} />
      <div
        style={{
          alignSelf: "center",
          display: "flex",
          padding: "8px",
          alignItems: "center",
        }}
      >
        <a href="https://appliedzkp.org" target="_blank">
          <img
            src={require("../../public/pse_logo.svg")}
            width="25px"
            style={{ cursor: "pointer" }}
          />
        </a>
        <div style={{ margin: "8px" }}>x</div>
        <a href="https://unirep.io" target="_blank">
          <img
            src={require("../../public/unirep_logo.svg")}
            width="20px"
            style={{ borderRadius: "20px", cursor: "pointer" }}
          />
        </a>
      </div>
    </div>
  );
});
