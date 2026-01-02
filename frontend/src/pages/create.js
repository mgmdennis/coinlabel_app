import {useParams, useNavigate, useLocation} from "react-router-dom";
import { useState, useEffect } from "react";
import {QRCode} from "react-qr-code";
import axios from "axios";

import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const Create = () => {
    const {numistaNumber} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [numistaDetails, setNumistaDetails] = useState({});
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [year, setYear] = useState("");
    const [details, setDetails] = useState("");
    const [denomination, setDenomination] = useState("");
    const [grade, setGrade] = useState("");
    const [gradeDetails, setGradeDetails] = useState("");   
    const [issuer, setIssuer] = useState("");
    const [reference, setReference] = useState("");
    const [mintage, setMintage] = useState("");
    const [composition, setComposition] = useState("");
    const [mass, setMass] = useState("");
    const [diameter, setDiameter] = useState("");
    const [orientation, setOrientation] = useState("");
    const [dateAdded, setDateAdded] = useState("");
    const [marksPicture, setMarksPicture] = useState(null);
    const [title, setTitle] = useState("");

    var updateNumistaDetails = (jsonData) => {
        const editCoinId = location && location.state && location.state.coinId ? location.state.coinId : null;
        if (editCoinId) {
            setNumistaDetails(jsonData);
            return;
        }

        setNumistaDetails(jsonData);
        setDenomination(jsonData.denomination);
        setIssuer(jsonData.issuer);
        setComposition(jsonData.composition);
        setMass(jsonData.mass);
        setOrientation(jsonData.orientation);
        setTitle(jsonData.title);
       
        if (jsonData.diameter.length > 0) {
            setDiameter("⌀ " + jsonData.diameter);
        }
        
        if (jsonData.variations && jsonData.variations.length > 0) {
            updateFillOutDateAndDetails(jsonData.variations[0], jsonData.description);
        }

        if (jsonData.references && jsonData.references.length > 0) {
            setReference(jsonData.references[0]);
        }
    }

    var updateFillOutDateAndDetails = (variation, description) => {
        setYear(variation.date);

        if (variation.mintage.length > 0) {
            setMintage("m. " + variation.mintage);
        } else {
            setMintage("");
        }

        if (variation.marks_picture) {
            setMarksPicture(variation.marks_picture);
        } else {
            setMarksPicture(null);
        }
        
        var comments = variation.comment;

        if(comments.includes("Proof")) {
            setGrade("Proof")
            comments = comments.replace("Proof", "");
        } else {
            setGrade("");
        }

        if (comments.length > 0) {
            setDetails(comments + "\n" + description);
        } else {
            setDetails(description);
        }
    }

    useEffect(() => {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
        setDateAdded(formattedDate);
        getNumistaDetails();
      }, []);

    useEffect(() => {
        if (!numistaDetails.denomination) return;

        const editCoinId = location && location.state && location.state.coinId ? location.state.coinId : null;

        if (editCoinId && !coinId) {
            axios.get(`${BASE_URL}/coin/${editCoinId}`)
                .then((res) => {
                        const c = res.data;
                        setCoinId(c._id);
                        setYear(c.year || "");
                        setIssuer(c.issuer || "");
                        setDenomination(c.denomination || "");
                        setGrade(c.grade || "");
                        setGradeDetails(c.gradeDetails || "");
                        setDetails(c.details || "");
                        setReference(c.reference || "");
                        setComposition(c.composition || "");
                        setMass(c.mass || "");
                        setDiameter(c.diameter || "");
                        setOrientation(c.orientation || "");
                        setMintage(c.mintage || "");
                        setDateAdded(c.dateAdded || dateAdded);
                        setMarksPicture(c.marksPicture || null); // Load marksPicture from DB
                        setInitialLoadComplete(true);
                    })
                .catch((err) => {
                    console.error("Error loading coin for edit:", err);
                    if (!coinId) createCoin();
                });
            return;
        }

        if (!coinId) {
            createCoin();
        }
    }, [numistaDetails]);

    useEffect(() => {
        if (coinId && initialLoadComplete) {
            updateCoinRemote();
        }
    }, [year, details, denomination, grade, gradeDetails, issuer, reference, mintage, composition, mass, diameter, orientation, dateAdded, marksPicture, coinId, initialLoadComplete]);

    const getNumistaDetails = () => {
        axios
          .get(`${BASE_URL}/numista/${numistaNumber}`)
          .then((res) => updateNumistaDetails(res.data))
          .catch((err) => console.error(err));
      };

    const createCoin = () => {
        axios
          .post(`${BASE_URL}/coin/new`, {
            numistaNumber,
            year,
            issuer,
            denomination,
            grade,
            gradeDetails,
            details,
            reference,
            composition,
            mass,
            diameter,
            orientation,
            mintage,
            dateAdded,
            marksPicture, // Save to DB
          })
          .then((res) => {
            setCoinId(res.data._id);
          })
          .catch((err) => console.error("Error creating coin:", err));
    };

    const updateCoinRemote = () => {
        axios
          .put(`${BASE_URL}/coin/update/${coinId}`, {
            numistaNumber,
            year,
            issuer,
            denomination,
            grade,
            gradeDetails,
            details,
            reference,
            composition,
            mass,
            diameter,
            orientation,
            mintage,
            dateAdded,
            marksPicture, // Update in DB
          })
          .then((res) => {
            console.log("Coin updated:", res.data);
          })
          .catch((err) => console.error("Error updating coin:", err));
    };

    const handleDiscard = () => {
        if (!coinId) return;
        axios
          .delete(`${BASE_URL}/coin/delete/${coinId}`)
          .then((res) => {
            navigate("/");
          })
          .catch((err) => console.error("Error discarding coin:", err));
    };

    const handleDuplicate = () => {
        axios
          .post(`${BASE_URL}/coin/new`, {
            numistaNumber,
            year,
            issuer,
            denomination,
            grade,
            gradeDetails,
            details,
            reference,
            composition,
            mass,
            diameter,
            orientation,
            mintage,
            dateAdded,
            marksPicture, // Duplicate includes image
          })
          .then((res) => {
            navigate("/");
          })
          .catch((err) => console.error("Error duplicating coin:", err));
    };

    const handleDone = () => {
        navigate("/");
    };
    
    return (
        <div>
            <h1>Create</h1>
            <h2>{title}</h2>
            <div>
                <Button variant="outline-danger" onClick={handleDiscard} style={{ marginBottom: '20px', marginRight: '10px' }}>
                    Discard
                </Button>
                <Button variant="outline-primary" onClick={handleDuplicate} style={{ marginBottom: '20px', marginRight: '10px' }}>
                    Duplicate
                </Button>
                <Button variant="outline-success" onClick={handleDone} style={{ marginBottom: '20px' }}>
                    Done
                </Button>
            </div>
            <div className="numista-details">
                <Form.Select
                    aria-label="Default select example"
                    plaintext
                    onChange={(e) => {
                        const selectedIndex = e.target.selectedIndex;
                        updateFillOutDateAndDetails(numistaDetails.variations[selectedIndex], numistaDetails.description);
                    }}>
                    {
                        (numistaDetails && numistaDetails.variations && numistaDetails.variations.length > 0) ? (
                            numistaDetails.variations.map((variation, index) => (
                                <option key={index} value={variation.date}>
                                    {variation.date} {variation.comment && `(${variation.comment})`}
                                </option>
                            ))
                        ) : (
                            <option value="0">No Variations</option>
                        )
                    }
                </Form.Select>
                <Form.Select
                    aria-label="Default select example"
                    plaintext
                    onChange={(e) => {
                        setReference(e.target.value);
                    }}>
                    {
                        (numistaDetails && numistaDetails.references && numistaDetails.references.length > 0) ? (
                            numistaDetails.references.map((ref, index) => (
                                <option key={index} value={ref}>
                                    {ref}
                                </option>
                            ))
                        ) : (
                            <option value="0">No References</option>
                        )
                    }
                </Form.Select>
                <Form.Select
                    aria-label="Select Sheldon Grade"
                    plaintext
                    onChange={(e) => {
                        setGrade(e.target.value);
                    }}
                >
                    <option value="">Select Sheldon Grade</option>
                    <option value="MS-70">MS-70</option>
                    <option value="MS-69">MS-69</option>
                    <option value="MS-68">MS-68</option>
                    <option value="MS-67">MS-67</option>
                    <option value="MS-66">MS-66</option>
                    <option value="MS-65">MS-65</option>
                    <option value="MS-64">MS-64</option>
                    <option value="MS-63">MS-63</option>
                    <option value="MS-62">MS-62</option>
                    <option value="MS-61">MS-61</option>
                    <option value="MS-60">MS-60</option>
                    <option value="BU">BU (Brilliant Uncirculated)</option>
                    <option value="UNC">UNC (Uncirculated)</option>
                    <option value="AU">AU (About Uncirculated)</option>
                    <option value="AU-55">AU-55</option>
                    <option value="AU-50">AU-50</option>
                    <option value="EF+">EF+ (Extremely Fine Plus)</option>
                    <option value="EF">EF (Extremely Fine)</option>
                    <option value="EF-45">EF-45</option>
                    <option value="EF-40">EF-40</option>
                    <option value="VF+">VF+ (Very Fine Plus)</option>
                    <option value="VF">VF (Very Fine)</option>
                    <option value="VF-30">VF-30</option>
                    <option value="VF-20">VF-20</option>
                    <option value="F+">F+ (Fine Plus)</option>
                    <option value="F">F (Fine)</option>
                    <option value="F-15">F-15 (Fine 15)</option>
                    <option value="F-12">F-12 (Fine 12)</option>
                    <option value="VG+">VG+ (Very Good Plus)</option>
                    <option value="VG">VG (Very Good)</option>
                    <option value="VG-10">VG-10 (Very Good 10)</option>
                    <option value="VG-8">VG-8 (Very Good 8)</option>
                    <option value="G+">G+ (Good Plus)</option>
                    <option value="G">G (Good)</option>
                    <option value="G-6">G-6 (Good 6)</option>
                    <option value="G-4">G-4 (Good 4)</option>
                    <option value="AG+">AG+ (About Good Plus)</option>
                    <option value="AG">AG (About Good)</option>
                    <option value="AG-3">AG-3 (About Good 3)</option>
                    <option value="Proof">Proof</option>
                    <option value="Specimen">Specimen</option>
                </Form.Select>
            </div>
            <div className="parent-label-large">
                <Form.Control
                    placeholder="Year"
                    value={year}
                    plaintext
                    className={"label date" + (year.length > 4 ? " narrow" : "")}
                    onChange={(e) => setYear(e.target.value)}
                />
                <Form.Control
                    placeholder="Issuer"
                    value={issuer}
                    plaintext
                    className={"label issuer" + (issuer.length > 20 ? " narrow" : "")}
                    onChange={(e) => setIssuer(e.target.value)}
                />
                <Form.Control
                    placeholder="Denomination"
                    value={denomination}
                    plaintext
                    as="textarea"
                    rows={2}
                    className={"label denomination" + (denomination.length > 10 ? " narrow" : "")}
                    onChange={(e) => setDenomination(e.target.value)}
                />
                <Form.Control
                    placeholder="Grade"
                    value={grade}
                    plaintext
                    className="label grade"
                    onChange={(e) => setGrade(e.target.value)}
                />
                <Form.Control
                    placeholder="Grade Details"
                    value={gradeDetails}
                    plaintext
                    className="label grade-details"
                    as="textarea"
                    rows={6}
                    onChange={(e) => setGradeDetails(e.target.value)}
                />
                <Form.Control
                    placeholder="Mintage"
                    value={mintage}
                    plaintext
                    className="label mintage"
                    onChange={(e) => setMintage(e.target.value)}
                />
                <Form.Control
                    placeholder="Ref"
                    value={reference}
                    plaintext
                    className="label reference"
                    onChange={(e) => setReference(e.target.value)}
                />

                <div className="stack-container">
                    {marksPicture && 
                        <div className="marks-picture-wrapper">
                            <img src={marksPicture} alt="Mint Mark" className="marks-picture" />
                        </div>
                    }
                    <Form.Control
                        placeholder="Details"
                        value={details}
                        plaintext
                        className="label details"
                        as="textarea"
                        rows={5}
                        onChange={(e) => setDetails(e.target.value)}
                    />
                </div>
            </div>
            <p />
            <div className="parent-label-large">
                <p className="label composition">
                    {composition}
                </p>
                <Form.Control
                    placeholder="Mass"
                    value={mass}
                    plaintext
                    className="label mass"
                    onChange={(e) => setMass(e.target.value)}
                />
                <Form.Control
                    placeholder="Diameter"
                    value={diameter}
                    plaintext
                    className="label diameter"
                    onChange={(e) => setDiameter(e.target.value)}
                />
                <Form.Control
                    placeholder="Date Added"
                    value={dateAdded}
                    plaintext
                    className="label date-added"
                    onChange={(e) => setDateAdded(e.target.value)}
                />
                <Form.Control
                    placeholder="Orientation"
                    value={orientation}
                    plaintext
                    className="label orientation"
                    onChange={(e) => setOrientation(e.target.value)}
                />
                <p className="label numista-number">{`N# ${numistaNumber}`}</p>
                
                <div className="qr-code">
                    <QRCode
        value={`https://numista.com/${numistaNumber}`}

        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
  
    /> </div>
            </div>
        </div>
    );
}
  
export default Create;