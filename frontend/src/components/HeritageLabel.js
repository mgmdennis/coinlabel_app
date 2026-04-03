import React from "react";
import styles from "./HeritageLabel.module.css";

function Field({ isEditable, value, onChange, placeholder, maxSize }) {
  const placeholderLen = maxSize ? Math.min((placeholder || "").length, maxSize) : (placeholder || "").length;
  const size = Math.max((value || "").length, placeholderLen, 3);
  return isEditable
    ? <input
        className={styles["field-inline"]}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        size={size}
      />
    : <span>{value}</span>;
}

function TextArea({ isEditable, value, onChange, placeholder }) {
  return isEditable
    ? <textarea className={styles["field-textarea"]} value={value} onChange={onChange} placeholder={placeholder} rows={2} />
    : <span>{value}</span>;
}

export default function HeritageLabel({
  isEditable = false,
  country = "CAN", setCountry,
  year = "1947", setYear,
  denomination = "$1.", setDenomination,
  grade = "MS63", setGrade,
  comments = "Maple Leaf", setComments,
  certNumber = "XUD 999", setCertNumber,
  opinion = "IN OUR OPINION THIS IS A\nGENUINE ORIGINAL ITEM.",
  warning = "Tampering with this sealed holder invalidates above opinion.\nHave holder replaced if inner package/seal not intact."
}) {
  return (
    <div className={styles["heritage-label"]}>
      <div className={styles["coin-data"]}>
        <div className={styles["coin-data-left"]}>
          <Field isEditable={isEditable} value={country} onChange={e => setCountry?.(e.target.value)} placeholder="Issuer" maxSize={3} />
          <span>&nbsp;</span>
          <Field isEditable={isEditable} value={year} onChange={e => setYear?.(e.target.value)} placeholder="Year" />
        </div>
        <div className={styles["coin-data-right"]}>
          <Field isEditable={isEditable} value={denomination} onChange={e => setDenomination?.(e.target.value)} placeholder="Denom" />
          <span>&nbsp;</span>
          <Field isEditable={isEditable} value={grade} onChange={e => setGrade?.(e.target.value)} placeholder="Grade" maxSize={4} />
        </div>
      </div>
      <hr />
      <div className={styles.heading}>Comments</div>
      <TextArea isEditable={isEditable} value={comments} onChange={e => setComments?.(e.target.value)} placeholder="Comments" />
      <hr />
      <div className={styles.heading}>Certification No.</div>
      <Field isEditable={isEditable} value={certNumber} onChange={e => setCertNumber?.(e.target.value)} placeholder="Cert No." />
      <hr />
      <div className={styles["opinion"]}>
        {opinion.split("\n").map((line, i) => (
          <React.Fragment key={i}>{line}<br /></React.Fragment>
        ))}
      </div>
      <div className={styles["warning"]}>
        {warning.split("\n").map((line, i) => (
          <React.Fragment key={i}>{line}<br /></React.Fragment>
        ))}
      </div>
    </div>
  );
}
