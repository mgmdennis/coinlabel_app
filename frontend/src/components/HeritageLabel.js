import React from "react";
import styles from "./HeritageLabel.module.css";

export default function HeritageLabel({
  country = "CAN",
  year = "1947",
  denomination = "$1.",
  grade = "MS63",
  comments = "Maple Leaf",
  certNumber = "XUD 999",
  opinion = "IN OUR OPINION THIS IS A\nGENUINE ORIGINAL ITEM.",
  warning = "Tampering with this sealed holder invalidates above opinion.\nHave holder replaced if inner package/seal not intact."
}) {
  return (
    <div className={styles["heritage-label"]}>
      <div className={styles.heading}>
        {country} &nbsp; {year} {denomination} &nbsp; {grade}
      </div>
      <hr />
      <div className={styles.heading}>Comments</div>
      <div className={styles.comments}>{comments}</div>
      <hr />
      <div className={styles.heading}>Certification No.</div>
      <div className={styles["cert-number"]}>{certNumber}</div>
      <hr />
      <div style={{ fontSize: "0.95em", margin: "10px 0 0 0" }}>
        {opinion.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </div>
      <div style={{ fontSize: "0.7em", marginTop: 8 }}>
        {warning.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
