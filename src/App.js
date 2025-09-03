import React, { useState, useEffect } from "react";
import * as asn1js from "asn1js";
import { OCSPResponse, BasicOCSPResponse } from "pkijs";
import {Buffer} from "buffer";
import axios from "axios";
import "./App.css";
function App() {
  const [activeSection, setActiveSection] = useState("root");

  // Root CA
  const [rootName, setRootName] = useState("");
  const [rootDN, setRootDN] = useState("");
  const [rootAlgo, setRootAlgo] = useState("RSA");
  const [rootResult, setRootResult] = useState(null);

  // Intermediate CA
  const [interName, setInterName] = useState("");
  const [interDN, setInterDN] = useState("");
  const [interAlgo, setInterAlgo] = useState("RSA");
  const [interRootList, setInterRootList] = useState([]);
  const [selectedRoot, setSelectedRoot] = useState("");
  const [interResult, setInterResult] = useState(null);

  // End Entity
  const [endName, setEndName] = useState("");
  const [endDN, setEndDN] = useState("");
  const [endAlgo, setEndAlgo] = useState("RSA");
  const [intermediateList, setIntermediateList] = useState([]);
  const [selectedInter, setSelectedInter] = useState("");
  const [endResult, setEndResult] = useState(null);

  // Get Certificate
  const [certId, setCertId] = useState("");
  const [certDetails, setCertDetails] = useState(null);

  // Revoke Certificate
  const [revokeId, setRevokeId] = useState("");
  const [revokeResult, setRevokeResult] = useState(null);
  //TimeStamp Authority
  const [tsaHash, setTsaHash] = useState("");
  const [tsaResult, setTsaResult] = useState(null);
  //OCSP Certificate
  const [ocspInterId, setOcspInterId] = useState("");
const [ocspSubjectDN, setOcspSubjectDN] = useState("");
const [ocspAlgo, setOcspAlgo] = useState("");
const [ocspResult, setOcspResult] = useState(null);
//OCSP checking
const [ocspCheckInterId, setOcspCheckInterId] = useState("");
const [ocspCheckEndId, setOcspCheckEndId] = useState("");
const [ocspCheckResult, setOcspCheckResult] = useState(null);
const[endentityList,setendentityList]=useState([]);
  // Fetch CA lists
  useEffect(() => {
    if (activeSection === "intermediate") {
      axios
        .get("http://localhost:5241/api/ca/roots")
        .then((res) => setInterRootList(res.data))
        .catch((err) => console.error(err));
    }
    if (activeSection === "end") {
      axios
        .get("http://localhost:5241/api/ca/intermediates")
        .then((res) => setIntermediateList(res.data))
        .catch((err) => console.error(err));
    }
  }, [activeSection]);
  useEffect(() => {
  if (activeSection === "ocsp") {
    axios.get("http://localhost:5241/api/CA/intermediates")
      .then(res => setIntermediateList(res.data))
      .catch(err => console.error(err));
  }
}, [activeSection]);
useEffect(() => {
  if (activeSection === "ocspCheck") {
    axios.get("http://localhost:5241/api/CA/intermediates")
      .then(res => setIntermediateList(res.data))
      .catch(err => console.error(err));
  }
}, [activeSection]);
useEffect(() => {
  if (activeSection === "ocspCheck") {
    axios.get("http://localhost:5241/api/CA/end")
      .then(res => setendentityList(res.data))
      .catch(err => console.error(err));
  }
}, [activeSection]);


  // Download helper
  const downloadCertificate = (certificate, filename = "certificate.pem") => {
    const element = document.createElement("a");
    const file = new Blob([certificate], { type: "application/x-pem-file" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  

  // API Handlers
  const generateRoot = async () => {
    try {
      const res = await axios.post("http://localhost:5241/api/ca/root", {
        name: rootName,
        subjectDN: rootDN,
        algorithm: rootAlgo,
      });
      setRootResult(res.data);
    } catch (err) {
      setRootResult({ error: err.message });
    }
  };

  const generateIntermediate = async () => {
    try {
      const res = await axios.post("http://localhost:5241/api/ca/intermediate", {
        name: interName,
        subjectDN: interDN,
        algorithm: interAlgo,
        issuerId: selectedRoot,
      });
      setInterResult(res.data);
    } catch (err) {
      setInterResult({ error: err.message });
    }
  };

  const generateEnd = async () => {
    try {
      const res = await axios.post("http://localhost:5241/api/ca/end", {
        name: endName,
        subjectDN: endDN,
        algorithm: endAlgo,
        issuerId: selectedInter,
      });
      setEndResult(res.data);
    } catch (err) {
      setEndResult({ error: err.message });
    }
  };

  const getCertificate = async () => {
    try {
      const res = await axios.get(`http://localhost:5241/api/ca/get?id=${certId}`);
      setCertDetails(res.data);
    } catch (err) {
      setCertDetails({ error: err.message });
    }
  };

const generateTimestamp = async () => { 
  try {
    const formData = new FormData();
    formData.append("algo", "SHA256"); // backend expects this
    formData.append("data_hash", tsaHash.trim());

    const res = await axios.post(
      "http://localhost:5298/api/TSA/pkcs7timestamp",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setTsaResult(res.data);
  } catch (err) {
    setTsaResult({ error: err.response?.data?.message || err.message });
  }
};


 const downloadFile = (content, filename, type = "application/octet-stream") => {
    const element = document.createElement("a");
    const file = new Blob([content], { type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  
  const createOcspResponder = async () => {
try {
const res = await axios.post("http://localhost:5241/api/CA/OCSP", {
IntermediateCAId: ocspInterId,
SubjectDN: ocspSubjectDN,
Algorithm:ocspAlgo,
});
setOcspResult(res.data);
} catch (err) {
setOcspResult({ error: err.response?.data || err.message });
}
};

const checkOcspStatus = async () => {
  if (!ocspCheckInterId || !ocspCheckEndId) {
    alert("Please fill both Intermediate CA ID and End Entity Cert ID");
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:5241/api/CA/ocsp/check",
      {
        IntermediateCAId: ocspCheckInterId,
        EndEntityCertId: ocspCheckEndId,
      },
      { responseType: "arraybuffer" }
    );

    const asn1 = asn1js.fromBER(res.data);
    if (asn1.offset === -1) throw new Error("Failed to parse DER OCSP response");

    const ocspResp = new OCSPResponse({ schema: asn1.result });

    const parsedResult = {
      responseStatus: ocspResp.responseStatus === 0 ? "successful" : ocspResp.responseStatus,
    };

    if (ocspResp.responseBytes) {
      const basicResp = new BasicOCSPResponse({
        schema: asn1js.fromBER(
          ocspResp.responseBytes.response.valueBlock.valueHex
        ).result,
      });

      // Extract responderId
      let responderId = "";
      if (basicResp.tbsResponseData.responderID.byName) {
        responderId = basicResp.tbsResponseData.responderID.byName.typesAndValues.map(
          (tav) => `${tav.type}=${tav.value.valueBlock.value}`
        ).join(", ");
      } else if (basicResp.tbsResponseData.responderID.byKey) {
        responderId = Buffer.from(
          basicResp.tbsResponseData.responderID.byKey.valueBlock.valueHex
        ).toString("hex").toUpperCase();
      }

      parsedResult.responderId = responderId;
      parsedResult.producedAt = basicResp.tbsResponseData.producedAt?.toISOString() || null;
      parsedResult.signatureAlgorithm = basicResp.signatureAlgorithm.algorithmId;

      // Map of revocation reasons
      const reasonMap = {
        0: "unspecified",
        1: "keyCompromise",
        2: "cACompromise",
        3: "affiliationChanged",
        4: "superseded",
        5: "cessationOfOperation",
        6: "certificateHold",
        8: "removeFromCRL",
        9: "privilegeWithdrawn",
        10: "aACompromise",
      };

      //Extract certificate status responses
      parsedResult.responses = basicResp.tbsResponseData.responses.map((r) => {
        let certStatus = "unknown";
        let revocationTime = null;
        let revocationReason = null;

        const rawStatus = r.certStatus;
        if (rawStatus.idBlock.tagNumber === 0) {
          certStatus = "good";
        } else if (rawStatus.idBlock.tagNumber === 1) {
          certStatus = "revoked";
          if (rawStatus.valueBlock) {
            if (rawStatus.valueBlock.revocationTime) {
              revocationTime = rawStatus.valueBlock.revocationTime.toISOString();
            }
            if (rawStatus.valueBlock.revocationReason) {
              const reasonCode = rawStatus.valueBlock.revocationReason.valueBlock.valueDec;
              revocationReason = reasonMap[reasonCode] || `code_${reasonCode}`;
            }
          }
        }

        return {
          certId: {
            hashAlgorithm: r.certID.hashAlgorithm.algorithmId,
            issuerNameHash: Buffer.from(r.certID.issuerNameHash.valueBlock.valueHex).toString("hex").toUpperCase(),
            issuerKeyHash: Buffer.from(r.certID.issuerKeyHash.valueBlock.valueHex).toString("hex").toUpperCase(),
            serialNumber: Buffer.from(r.certID.serialNumber.valueBlock.valueHex).toString("hex").toUpperCase(),
          },
          certStatus,
          revocationTime,
          revocationReason,
          thisUpdate: r.thisUpdate.toISOString(),
          nextUpdate: r.nextUpdate ? r.nextUpdate.toISOString() : null,
        };
      });

      // Extract certificates (clean DN strings)

      parsedResult.certificates = basicResp.certs
        ? basicResp.certs.map((cert) => {
            return cert.subject.typesAndValues.map((tav) => ({
              type: tav.type,
              value: tav.value.valueBlock.value, // clean string
            }));
          })
        : [];
    }

    setOcspCheckResult({
      // status: JSON.stringify(parsedResult.responses.certStatus, null, 2),
       status: parsedResult.responses[0]?.certStatus || "unknown",
      downloadUrl: URL.createObjectURL(
        new Blob([res.data], { type: "application/ocsp-response" })
      ),
      filename: "ocsp_response.der",
    });
  } catch (err) {
    setOcspCheckResult({ error: err.response?.data || err.message });
  }
};

    

  const renderCertificateDetails = (data, namePrefix = "") => {
  if (!data) return null;

  // If backend returned an error message
  if (data.error || data.message) {
    return <pre className="error">{data.error || data.message}</pre>;
  }

  return (
    <div className="cert-details">
      <h4>Certificate Details</h4>
      <table>
        <tbody>
          {data.id && (
            <tr>
              <th>ID</th>
              <td>{data.id}</td>
            </tr>
          )}
          {data.name && (
            <tr>
              <th>Name</th>
              <td>{data.name || namePrefix}</td>
            </tr>
          )}
          {data.algorithm && (
            <tr>
              <th>Algorithm</th>
              <td>{data.algorithm}</td>
            </tr>
          )}
          {data.keySize && (
            <tr>
              <th>Key Size</th>
              <td>{data.keySize}</td>
            </tr>
          )}
          {data.curve && (
            <tr>
              <th>Curve</th>
              <td>{data.curve}</td>
            </tr>
          )}
          {data.notBefore && (
            <tr>
              <th>Valid From</th>
              <td>{new Date(data.notBefore).toLocaleString()}</td>
            </tr>
          )}
          {data.notAfter && (
            <tr>
              <th>Valid To</th>
              <td>{new Date(data.notAfter).toLocaleString()}</td>
            </tr>
          )}
          {data.isRevoked !== undefined && (
            <tr>
              <th>Revoked</th>
              <td>
                {data.isRevoked
                  ? `Yes (at ${new Date(data.revokedAt).toLocaleString()})`
                  : "No"}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {(data.certificatePem || data.certificate) && (
        <button
          onClick={() =>
            downloadCertificate(
              data.certificatePem || data.certificate,
              `${(data.name || namePrefix).replace(/\s/g, "_")}_Certificate.pem`
            )
          }
        >
          Download Certificate
        </button>
      )}
    </div>
  );
};
  return (
    <div className="container">
      <div class="sidebar">
        <h2>PKI Dashboard</h2>
  <div class="menu">
     <div
    className={`menu-item ${activeSection === "root" ? "active" : ""}`}
    onClick={() => setActiveSection("root")}
  >
    Generate Root Certificate
  </div>
    <div className={`menu-item ${activeSection === "intermediate" ? "active":""}`} 
    onClick={()=>setActiveSection("intermediate")}>
      Generate Intermediate Certificate
    </div>
   <div className={`menu-item ${activeSection === "end" ? "active":""}`} 
    onClick={()=>setActiveSection("end")}>
      Generate EndEntity Certificate
    </div>
    <div className={`menu-item ${activeSection === "get" ? "active":""}`} 
    onClick={()=>setActiveSection("get")}>
      Certificate Information
    </div>
    <div className={`menu-item ${activeSection === "revoke" ? "active":""}`} 
    onClick={()=>setActiveSection("revoke")}>
      Revoke Certificates
    </div>
    <div className={`menu-item ${activeSection === "tsa" ? "active":""}`} 
    onClick={()=>setActiveSection("tsa")}>
      TimeStamping Authority
    </div>
    <div className={`menu-item ${activeSection === "ocsp" ? "active" : ""}`} onClick={() => setActiveSection("ocsp")}> Generate OCSP Certificate</div>
    <div className={`menu-item ${activeSection == "ocspCheck" ? "active": ""}`}onClick={()=>setActiveSection("ocspCheck")}>OCSP Status</div>
  </div>
</div>


      <div className="content">
        {activeSection === "root" && (
  <div className="form-card">
 <h3>📜 Generate Root Certificate</h3>


    <div className="form-group">
      <label>Name</label>
      <input
        className="form-input"
        value={rootName}
        onChange={(e) => setRootName(e.target.value)}
        placeholder="Enter Root CA Name"
      />
    </div>

    <div className="form-group">
      <label>Subject DN</label>
      <input
        className="form-input"
        value={rootDN}
        onChange={(e) => setRootDN(e.target.value)}
        placeholder="CN=CommonName,O=Organization,C=Country"
      />
    </div>

    <div className="form-group">
      <label>Algorithm</label>
      <select
        className="form-input"
        value={rootAlgo}
        onChange={(e) => setRootAlgo(e.target.value)}
      >
        <option value="">Select Algorithm</option>
        <option value="RSA">RSA</option>
        <option value="ECC">ECC</option>
      </select>
    </div>

    <div className="form-actions">
      <button
        className="btn-primary"
        onClick={async () => {
          await generateRoot();
          setRootName("");
          setRootDN("");
          setRootAlgo("");
        }}
      >
        Generate
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setRootName("");
          setRootDN("");
          setRootAlgo("");
          setRootResult("");
        }}
      >
        Clear
      </button>
    </div>

    {renderCertificateDetails(rootResult, rootName)}
  </div>
)}
        {activeSection === "intermediate" && (
  <div className="form-card">
    <h3> 📜 Generate Intermediate Certificate</h3>

    <div className="form-group">
      <label>Name</label>
      <input
        className="form-input"
        value={interName}
        onChange={(e) => setInterName(e.target.value)}
        placeholder="Enter Intermediate CA Name"
      />
    </div>

    <div className="form-group">
      <label>Subject DN</label>
      <input
        className="form-input"
        value={interDN}
        onChange={(e) => setInterDN(e.target.value)}
        placeholder="CN=CommonName,O=Organization,C=Country"
      />
    </div>
    <div className="form-group">
      <label>Algorithm</label>
      <select
        className="form-input"
        value={interAlgo}
        onChange={(e) => setInterAlgo(e.target.value)}
      >
        <option value="">Select Algorithm</option>
        <option value="RSA">RSA</option>
        <option value="ECC">ECC</option>
      </select>
    </div>

    <div className="form-group">
      <label>Choose Root CA</label>
            <select value={selectedRoot} onChange={(e) => setSelectedRoot(e.target.value)}>
              <option value="">Select Root CA</option>
              {interRootList.map((root) => (
                <option key={root.id} value={root.id}>
                  {root.name}
                </option>
              ))}
            </select>
    </div>

    <div className="form-actions">
      <button
        className="btn-primary"
        onClick={async () => {
          await generateIntermediate();
          setInterName("");
          setInterDN("");
          setInterAlgo("");
        }}
      >
        Generate
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setInterName("");
          setInterDN("");
          setInterAlgo("");
          setSelectedRoot("");
          setInterResult("");
        }}
      >
        Clear
      </button>
    </div>

    {renderCertificateDetails(interResult, interName)}
  </div>
)}

        {activeSection === "end" && (
  <div className="form-card">
    <h3> 📜 Generate EndEntity Certificate</h3>

    <div className="form-group">
      <label>Name</label>
      <input
        className="form-input"
        value={endName}
        onChange={(e) => setEndName(e.target.value)}
        placeholder="Enter EndEntity CA Name"
      />
    </div>

    <div className="form-group">
      <label>Subject DN</label>
      <input
        className="form-input"
        value={endDN}
        onChange={(e) => setEndDN(e.target.value)}
        placeholder="CN=CommonName,O=Organization,C=Country"
      />
    </div>
    <div className="form-group">
      <label>Algorithm</label>
      <select
        className="form-input"
        value={endAlgo}
        onChange={(e) => setEndAlgo(e.target.value)}
      >
        <option value="">Select Algorithm</option>
        <option value="RSA">RSA</option>
        <option value="ECC">ECC</option>
      </select>
    </div>

    <div className="form-group">
       <label>Choose Intermediate CA</label>
            <select value={selectedInter} onChange={(e) => setSelectedInter(e.target.value)}>
              <option value="">Select Intermediate CA</option>
              {intermediateList.map((inter) => (
                <option key={inter.id} value={inter.id}>
                  {inter.name}
                </option>
              ))}
            </select>
    </div>

    <div className="form-actions">
      <button
        className="btn-primary"
        onClick={async () => {
          await generateEnd();
          setEndName("");
          setEndDN("");
          setEndAlgo("");
          setSelectedInter("");
        }}
      >
        Generate
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setEndName("");
          setEndDN("");
          setEndAlgo("");
          setSelectedInter("");
          setEndResult("");
        }}
      >
        Clear
      </button>
    </div>

    {renderCertificateDetails(endResult, endName)}
  </div>
)}
{activeSection === "get" && (
  <div>
            <h3>Get Certificate Info</h3>
            <label>Certificate ID</label>
            <input  value={certId} onChange={(e) => setCertId(e.target.value)} />
            <button onClick={getCertificate}>Get</button> <button
                className="btn btn-ghost"
                onClick={() => {
                  setCertId("");
                  setCertDetails("");
                }}
              >
                Clear
              </button>
            {renderCertificateDetails(certDetails)}
            </div>
        )}


        {activeSection === "revoke" && (
          <div>
            <h3>Revoke Certificate</h3>
            <label>Certificate ID</label>
            <input value={revokeId} onChange={(e) => setRevokeId(e.target.value)} />
            <button
              onClick={async () => {
                try {
                  const res = await axios.post(
                    `http://localhost:5241/api/ca/revoke/${revokeId}`
                  );
                  setRevokeResult(res.data);
                } catch (err) {
                  const error = err.response?.data?.message || err.message;
                  setRevokeResult({ error });
                }
              }}
            >
              Revoke
            </button>
             <button
                className="btn btn-ghost"
                onClick={() => {
                  setRevokeId("");
                  setRevokeResult("");
                }}
              >
                Clear
              </button>
            {revokeResult && (
  <div style={{
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "10px",
    marginTop: "10px",
    background: "#f9f9f9"
  }}>
    {revokeResult.error ? (
      <p style={{ color: "red" }}>❌ Error: {revokeResult.error}</p>
    ) : (
      <>
        <h4>Revocation Result</h4>
        {Object.entries(revokeResult).map(([key, value]) => (
          <p key={key}><strong>{key}:</strong> {String(value)}</p>
        ))}
      </>
    )}
  </div>
)}

          </div>
        )}

        
         {activeSection === "tsa" && (
          <div className="tsa-section">
            <h3 className="section-title">PKCS7 Timestamp (TSA)</h3>

            <div className="form-group">
              <label>Algorithm</label>
              <input type="text" value="SHA256" readOnly className="input readonly" />
            </div>

            <div className="form-group">
  <label>Data Hash (Base64)</label>
  <textarea
    value={tsaHash}
    onChange={(e) => setTsaHash(e.target.value)}
    placeholder="Paste Base64-encoded SHA256 hash…"
    className="input textarea mono big-textarea"
    rows={4}  // make taller
    cols={80} // make wider
  />
</div>


            
              <button
                className="btn btn-primary"
                onClick={generateTimestamp}
                disabled={!tsaHash.trim()}
              >
                Get TimeStamp
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setTsaHash("");
                  setTsaResult(null);
                }}
              >
                Clear
              </button>

            {tsaResult && (
              <div className="result">
                {tsaResult.error ? (
                  <div className="alert-error">{tsaResult.error}</div>
                ) : (
                  <>
                    <div className="result-item">
                      <div className="result-label">Timestamp</div>
                      <div className="result-value mono">
                        {tsaResult.timestamp}
                      </div>
                    </div>

                    <div className="result-item">
                      <div className="result-label">PKCS#7 Signature (Base64)</div>
                      <textarea
                        readOnly
                        className="input textarea mono"
                        rows={8}
                        cols={100}
                        value={tsaResult.message || ""}
                      />
                      <div className="result-actions">
                        <button
                          className="btn btn-mini"
                          onClick={() =>
                            downloadFile(
                              tsaResult.message,
                              `pkcs7_timestamp_${(tsaResult.timestamp || "")
                                .replace(/[:.]/g, "-")}.p7s`,
                              "application/pkcs7-mime"
                            )
                          }
                        >
                          Download
                        </button>
                 <button>
                <a
                  className="btn btn-mini btn-outline"
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                    tsaResult.message || ""
                  )}`}
                  download={`pkcs7_${(tsaResult.timestamp || "")
                    .replace(/[:.]/g, "-")}.b64.txt`}
                >
                  Download Base64
                </a>
                </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
             {activeSection === "ocsp" && (
                    <div className="form-card">
                     <h3>Generate OCSP Certificate</h3>
                      <div className="form-group">
                      <label>Choose Intermediate CA</label>
            <select value={ocspInterId} onChange={(e) => setOcspInterId(e.target.value)}>
  <option value="">Select Intermediate CA</option>
  {intermediateList.map((inter) => (
    <option key={inter.id} value={inter.id}>{inter.id}</option>
  ))}
</select>
         </div>
           <div className="form-group">
              <label>Subject DN</label>
                <input className="form-input" value={ocspSubjectDN} onChange={(e) => setOcspSubjectDN(e.target.value)} placeholder="CN=OCSP Responder,O=Org,C=US" />
            </div>
              <div className="form-group">
                <label>Algorithm</label>
      <         select
                     className="form-input"
                      value={ocspAlgo}
                      onChange={(e) => setOcspAlgo(e.target.value)}
                       >
                         <option value="">Select Algorithm</option>
                                <option value="RSA">RSA</option>
                                <option value="ECC">ECC</option>
                </select>
             </div>
             <div className="form-actions">
                    <button className="btn-primary" onClick={createOcspResponder}>Generate</button>
            <button className="btn-secondary" onClick={() => { setOcspInterId(""); setOcspSubjectDN(""); setOcspAlgo(""); setOcspResult(null); }}>Clear</button>
         </div>
         {renderCertificateDetails(ocspResult, "OCSP")}
   </div>
   )}

   {activeSection === "ocspCheck" && (
  <div className="form-card">
    <h3>Check OCSP Status</h3>

    {/* Intermediate CA */}
    <div className="form-group">
      <label>Choose Intermediate CA</label>
      <select
        value={ocspCheckInterId}
        onChange={(e) => setOcspCheckInterId(e.target.value)}
      >
        <option value="">Select Intermediate CA</option>
        {intermediateList.map((inter) => (
          <option key={inter.id} value={inter.id}>
            {inter.id} {/* show GUID */}
          </option>
        ))}
      </select>
    </div>

    {/* End Entity Certificate */}
    <div className="form-group">
      <label>End Entity Certificate ID</label>
      <select
        value={ocspCheckEndId}
        onChange={(e) => setOcspCheckEndId(e.target.value)}
      >
        <option value="">Select End CA</option>
        {endentityList.map((inter) => (
          <option key={inter.id} value={inter.id}>
            {inter.id} {/* show GUID */}
          </option>
        ))}
      </select>
    </div>

    {/* Buttons */}
    <div className="form-actions">
      <button className="btn-primary" onClick={checkOcspStatus}>
        Check Status
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setOcspCheckInterId("");
          setOcspCheckEndId("");
          setOcspCheckResult(null);
        }}
      >
        Clear
      </button>
    </div>

{ocspCheckResult && (
  <div className="cert-details">
    {ocspCheckResult.error ? (
      <pre className="error">{ocspCheckResult.error}</pre>
    ) : (
      <div>
        
        <div>
  <pre
    style={{
      whiteSpace: "pre-wrap",
      background: "#f3f3f3",
      padding: "10px",
      borderRadius: "6px",
      color:
        ocspCheckResult.status === "good"
          ? "green"
          : ocspCheckResult.status === "revoked"
          ? "red"
          : "orange", // for unknown
      fontWeight: "bold",
    }}
  >
    {ocspCheckResult.status}
  </pre>
</div>

        {ocspCheckResult.downloadUrl && (
          <a
            href={ocspCheckResult.downloadUrl}
            download={ocspCheckResult.filename}
            className="btn btn-mini btn-outline"
          >
            Download OCSP Response (DER)
          </a>
        )}
      </div>
    )}
  </div>
)}


  </div>
)}

      </div>
      </div>
  );
}

export default App;