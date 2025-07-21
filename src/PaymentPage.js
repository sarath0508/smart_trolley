import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import "./styles.css";

const PaymentPage = ({ cart, total, onBack, onComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("initial"); // initial, processing, otp_sent, completed, failed
  const [netBankingDetails, setNetBankingDetails] = useState({
    bank: "",
    accountNumber: "",
    ifsc: ""
  });
  const [walletDetails, setWalletDetails] = useState({
    provider: "",
    mobileNumber: ""
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [paymentTimer, setPaymentTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [transactionId, setTransactionId] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [networkError, setNetworkError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [paymentStatusDetails, setPaymentStatusDetails] = useState({
    status: "initial",
    message: "",
    code: null
  });
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [lastVerificationTime, setLastVerificationTime] = useState(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  // Receiver UPI ID (this would typically come from your backend)
  const RECEIVER_UPI_ID = "itssarath05@okaxis";

  // Payment status codes
  const PAYMENT_STATUS = {
    INITIAL: "initial",
    PROCESSING: "processing",
    PENDING: "pending",
    VERIFYING: "verifying",
    COMPLETED: "completed",
    FAILED: "failed",
    EXPIRED: "expired",
    CANCELLED: "cancelled"
  };

  // Payment status messages
  const PAYMENT_MESSAGES = {
    [PAYMENT_STATUS.INITIAL]: "Ready to process payment",
    [PAYMENT_STATUS.PROCESSING]: "Processing your payment...",
    [PAYMENT_STATUS.PENDING]: "Payment is pending verification",
    [PAYMENT_STATUS.VERIFYING]: "Verifying payment details...",
    [PAYMENT_STATUS.COMPLETED]: "Payment completed successfully",
    [PAYMENT_STATUS.FAILED]: "Payment failed. Please try again",
    [PAYMENT_STATUS.EXPIRED]: "Payment session expired",
    [PAYMENT_STATUS.CANCELLED]: "Payment was cancelled"
  };

  // Generate unique transaction ID
  const generateTransactionId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TXN${timestamp}${random}`.toUpperCase();
  };

  // Generate UPI payment URL
  const generateUpiUrl = () => {
    const txnId = generateTransactionId();
    setTransactionId(txnId);
    const params = new URLSearchParams({
      pa: RECEIVER_UPI_ID,
      pn: "Your Store Name",
      am: total.toString(),
      cu: "INR",
      tr: txnId,
      tn: `Payment for Order ${txnId}`
    });
    return `upi://pay?${params.toString()}`;
  };

  // Enhanced payment verification
  const verifyPayment = async (txnId) => {
    try {
      setPaymentStatusDetails({
        status: PAYMENT_STATUS.VERIFYING,
        message: "Verifying payment details...",
        code: null
      });

      // Simulate API call to verify payment
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          // In a real application, this would be an API call to your backend
          const isSuccess = Math.random() > 0.3;
          resolve({
            status: isSuccess ? "success" : "pending",
            message: isSuccess ? "Payment verified" : "Payment verification pending",
            code: isSuccess ? 200 : 202
          });
        }, 2000);
      });

      setVerificationAttempts(prev => prev + 1);
      setLastVerificationTime(new Date().toISOString());

      if (response.status === "success") {
        setVerificationStatus("verified");
        setPaymentStatusDetails({
          status: PAYMENT_STATUS.COMPLETED,
          message: "Payment verified successfully",
          code: 200
        });
        return true;
      } else {
        setVerificationStatus("pending");
        setPaymentStatusDetails({
          status: PAYMENT_STATUS.PENDING,
          message: "Payment verification pending",
          code: 202
        });
        return false;
      }
    } catch (error) {
      setNetworkError("Failed to verify payment. Please try again.");
      setPaymentStatusDetails({
        status: PAYMENT_STATUS.FAILED,
        message: "Verification failed",
        code: 500
      });
      return false;
    }
  };

  // Add payment to history
  const addToPaymentHistory = (payment) => {
    setPaymentHistory(prev => [...prev, {
      ...payment,
      timestamp: new Date().toISOString()
    }]);
  };

  // Start payment timer
  useEffect(() => {
    if (showQrCode) {
      setQrValue(generateUpiUrl());
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowQrCode(false);
            setPaymentError("Payment session expired. Please try again.");
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
      setPaymentTimer(timer);
    }

    return () => {
      if (paymentTimer) {
        clearInterval(paymentTimer);
      }
    };
  }, [showQrCode]);

  // Check payment status periodically
  useEffect(() => {
    if (showQrCode && transactionId) {
      const checkPaymentStatus = async () => {
        try {
          const isVerified = await verifyPayment(transactionId);
          if (isVerified) {
            clearInterval(paymentTimer);
            setPaymentStatus("completed");
            addToPaymentHistory({
              method: "UPI",
              amount: total,
              transactionId,
              status: "success"
            });
            setShowSuccess(true);
            setTimeout(() => {
              onComplete();
            }, 2000);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
          setNetworkError("Network error. Please check your connection.");
        }
      };

      const statusCheckInterval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(statusCheckInterval);
    }
  }, [showQrCode, transactionId]);

  // Format time left
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const validateCardDetails = () => {
    const errors = {};
    if (!cardDetails.number || cardDetails.number.replace(/\s/g, "").length !== 16) {
      errors.cardNumber = "Please enter a valid 16-digit card number";
    }
    if (!cardDetails.name.trim()) {
      errors.cardName = "Please enter card holder name";
    }
    if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      errors.expiry = "Please enter a valid expiry date (MM/YY)";
    }
    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
      errors.cvv = "Please enter a valid 3-digit CVV";
    }
    return errors;
  };

  const validateUpiId = () => {
    const errors = {};
    if (!upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId)) {
      errors.upiId = "Please enter a valid UPI ID";
    }
    return errors;
  };

  const validateNetBanking = () => {
    const errors = {};
    if (!netBankingDetails.bank) {
      errors.bank = "Please select a bank";
    }
    if (!netBankingDetails.accountNumber || !/^\d{9,18}$/.test(netBankingDetails.accountNumber)) {
      errors.accountNumber = "Please enter a valid account number";
    }
    if (!netBankingDetails.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(netBankingDetails.ifsc)) {
      errors.ifsc = "Please enter a valid IFSC code";
    }
    return errors;
  };

  const validateWallet = () => {
    const errors = {};
    if (!walletDetails.provider) {
      errors.provider = "Please select a wallet provider";
    }
    if (!walletDetails.mobileNumber || !/^\d{10}$/.test(walletDetails.mobileNumber)) {
      errors.mobileNumber = "Please enter a valid 10-digit mobile number";
    }
    return errors;
  };

  // Enhanced payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    setValidationErrors({});
    setNetworkError(null);
    setPaymentAttempts(prev => prev + 1);

    let errors = {};
    switch (paymentMethod) {
      case "card":
        errors = validateCardDetails();
        break;
      case "upi":
        errors = validateUpiId();
        break;
      case "netbanking":
        errors = validateNetBanking();
        break;
      case "wallet":
        errors = validateWallet();
        break;
      default:
        break;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsProcessing(true);
    setPaymentStatusDetails({
      status: PAYMENT_STATUS.PROCESSING,
      message: "Processing your payment...",
      code: null
    });

    try {
      const txnId = generateTransactionId();
      setTransactionId(txnId);

      switch (paymentMethod) {
        case "card":
          setPaymentStatusDetails({
            status: PAYMENT_STATUS.PENDING,
            message: "Sending OTP...",
            code: null
          });
          setPaymentStatus("otp_sent");
          setShowOtp(true);
          break;

        case "upi":
          setPaymentStatusDetails({
            status: PAYMENT_STATUS.PENDING,
            message: "Initiating UPI payment...",
            code: null
          });
          // Wait for actual payment completion
          const isVerified = await verifyPayment(txnId);
          if (isVerified) {
            addToPaymentHistory({
              method: "UPI",
              amount: total,
              transactionId: txnId,
              status: "success",
              timestamp: new Date().toISOString()
            });
            setShowSuccess(true);
          }
          break;

        case "netbanking":
          setPaymentStatusDetails({
            status: PAYMENT_STATUS.PENDING,
            message: "Redirecting to bank...",
            code: null
          });
          // Wait for actual payment completion
          const bankVerified = await verifyPayment(txnId);
          if (bankVerified) {
            addToPaymentHistory({
              method: "Net Banking",
              amount: total,
              transactionId: txnId,
              status: "success",
              timestamp: new Date().toISOString()
            });
            setShowSuccess(true);
          }
          break;

        case "wallet":
          setPaymentStatusDetails({
            status: PAYMENT_STATUS.PENDING,
            message: "Processing wallet payment...",
            code: null
          });
          // Wait for actual payment completion
          const walletVerified = await verifyPayment(txnId);
          if (walletVerified) {
            addToPaymentHistory({
              method: "Wallet",
              amount: total,
              transactionId: txnId,
              status: "success",
              timestamp: new Date().toISOString()
            });
            setShowSuccess(true);
          }
          break;

        case "qr":
          setPaymentStatusDetails({
            status: PAYMENT_STATUS.PENDING,
            message: "Generating QR code...",
            code: null
          });
          setShowQrCode(true);
          setTimeLeft(300);
          break;

        default:
          break;
      }
    } catch (error) {
      setPaymentStatusDetails({
        status: PAYMENT_STATUS.FAILED,
        message: "Payment failed. Please try again.",
        code: 500
      });
      setPaymentError("Payment failed. Please try again.");
      setNetworkError("Network error. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);
    setPaymentStatusDetails({
      status: PAYMENT_STATUS.VERIFYING,
      message: "Verifying OTP...",
      code: null
    });

    if (!otp || otp.length !== 6) {
      setValidationErrors({ otp: "Please enter a valid 6-digit OTP" });
      setIsProcessing(false);
      return;
    }

    try {
      // Simulate OTP verification with actual API call
      const isVerified = await verifyPayment(transactionId);
      if (isVerified) {
        addToPaymentHistory({
          method: "Card",
          amount: total,
          transactionId,
          status: "success",
          timestamp: new Date().toISOString()
        });
        setShowSuccess(true);
      } else {
        setPaymentStatusDetails({
          status: PAYMENT_STATUS.FAILED,
          message: "OTP verification failed",
          code: 400
        });
        setPaymentError("OTP verification failed. Please try again.");
      }
    } catch (error) {
      setPaymentStatusDetails({
        status: PAYMENT_STATUS.FAILED,
        message: "Verification failed",
        code: 500
      });
      setPaymentError("OTP verification failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const renderPaymentMethodForm = () => {
    switch (paymentMethod) {
      case "card":
        return (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "15px",
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e9ecef"
          }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: formatCardNumber(e.target.value)})}
                maxLength="19"
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.cardNumber ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              />
              {validationErrors.cardNumber && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.cardNumber}
                </span>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Card Holder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.cardName ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              />
              {validationErrors.cardName && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.cardName}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                  maxLength="5"
                  style={{ 
                    padding: "10px",
                    borderRadius: "4px",
                    border: validationErrors.expiry ? "1px solid #dc3545" : "1px solid #ced4da",
                    width: "100%",
                    fontSize: "16px"
                  }}
                />
                {validationErrors.expiry && (
                  <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                    {validationErrors.expiry}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, "").slice(0, 3)})}
                  maxLength="3"
                  style={{ 
                    padding: "10px",
                    borderRadius: "4px",
                    border: validationErrors.cvv ? "1px solid #dc3545" : "1px solid #ced4da",
                    width: "100%",
                    fontSize: "16px"
                  }}
                />
                {validationErrors.cvv && (
                  <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                    {validationErrors.cvv}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case "upi":
        return (
          <div style={{ 
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Your UPI ID</label>
              <input
                type="text"
                placeholder="example@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.upiId ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              />
              {validationErrors.upiId && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.upiId}
                </span>
              )}
            </div>
            <div style={{ 
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              marginTop: "10px"
            }}>
              <p style={{ margin: "0", color: "#495057" }}>
                <strong>Receiver UPI ID:</strong> {RECEIVER_UPI_ID}
              </p>
              <p style={{ margin: "5px 0 0", color: "#6c757d", fontSize: "14px" }}>
                Amount to pay: ₹{total}
              </p>
            </div>
          </div>
        );

      case "qr":
        return (
          <div style={{ 
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            textAlign: "center"
          }}>
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ color: "#495057", marginBottom: "10px" }}>Scan QR Code to Pay</h4>
              <div style={{ 
                width: "200px", 
                height: "200px", 
                margin: "0 auto",
                padding: "10px",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px"
              }}>
                <QRCode
                  value={qrValue}
                  size={180}
                  level="H"
                />
              </div>
              <p style={{ margin: "15px 0 0", color: "#495057" }}>
                Amount to pay: ₹{total}
              </p>
              <p style={{ margin: "5px 0 0", color: "#6c757d", fontSize: "14px" }}>
                Scan using any UPI app
              </p>
              <div style={{ 
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px"
              }}>
                <p style={{ margin: "0", color: "#495057" }}>
                  <strong>Time remaining:</strong> {formatTimeLeft()}
                </p>
                <p style={{ margin: "5px 0 0", color: "#6c757d", fontSize: "14px" }}>
                  QR code will expire after 5 minutes
                </p>
              </div>
              {verificationStatus === "pending" && (
                <div style={{ 
                  marginTop: "10px",
                  padding: "10px",
                  backgroundColor: "#fff3e0",
                  borderRadius: "4px"
                }}>
                  <p style={{ margin: "0", color: "#ef6c00" }}>
                    Verifying payment...
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "netbanking":
        return (
          <div style={{ 
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Select Bank</label>
              <select
                value={netBankingDetails.bank}
                onChange={(e) => setNetBankingDetails({...netBankingDetails, bank: e.target.value})}
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.bank ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              >
                <option value="">Select a bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
              </select>
              {validationErrors.bank && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.bank}
                </span>
              )}
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Account Number</label>
              <input
                type="text"
                placeholder="Enter account number"
                value={netBankingDetails.accountNumber}
                onChange={(e) => setNetBankingDetails({...netBankingDetails, accountNumber: e.target.value})}
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.accountNumber ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              />
              {validationErrors.accountNumber && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.accountNumber}
                </span>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>IFSC Code</label>
              <input
                type="text"
                placeholder="Enter IFSC code"
                value={netBankingDetails.ifsc}
                onChange={(e) => setNetBankingDetails({...netBankingDetails, ifsc: e.target.value.toUpperCase()})}
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.ifsc ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              />
              {validationErrors.ifsc && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.ifsc}
                </span>
              )}
            </div>
          </div>
        );

      case "wallet":
        return (
          <div style={{ 
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Select Wallet</label>
              <select
                value={walletDetails.provider}
                onChange={(e) => setWalletDetails({...walletDetails, provider: e.target.value})}
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.provider ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              >
                <option value="">Select a wallet</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="amazonpay">Amazon Pay</option>
                <option value="mobikwik">MobiKwik</option>
              </select>
              {validationErrors.provider && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.provider}
                </span>
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#495057" }}>Mobile Number</label>
              <input
                type="text"
                placeholder="Enter mobile number"
                value={walletDetails.mobileNumber}
                onChange={(e) => setWalletDetails({...walletDetails, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10)})}
                maxLength="10"
                style={{ 
                  padding: "10px",
                  borderRadius: "4px",
                  border: validationErrors.mobileNumber ? "1px solid #dc3545" : "1px solid #ced4da",
                  width: "100%",
                  fontSize: "16px"
                }}
              />
              {validationErrors.mobileNumber && (
                <span style={{ color: "#dc3545", fontSize: "14px", marginTop: "5px", display: "block" }}>
                  {validationErrors.mobileNumber}
                </span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Enhanced payment status display
  const renderPaymentStatus = () => {
    if (paymentStatusDetails.status === "initial") return null;

    const statusColors = {
      [PAYMENT_STATUS.PROCESSING]: { bg: "#e3f2fd", border: "#bbdefb", text: "#1565c0" },
      [PAYMENT_STATUS.PENDING]: { bg: "#fff3e0", border: "#ffe0b2", text: "#ef6c00" },
      [PAYMENT_STATUS.VERIFYING]: { bg: "#e8f5e9", border: "#c8e6c9", text: "#2e7d32" },
      [PAYMENT_STATUS.COMPLETED]: { bg: "#e8f5e9", border: "#c8e6c9", text: "#2e7d32" },
      [PAYMENT_STATUS.FAILED]: { bg: "#ffebee", border: "#ffcdd2", text: "#c62828" },
      [PAYMENT_STATUS.EXPIRED]: { bg: "#ffebee", border: "#ffcdd2", text: "#c62828" },
      [PAYMENT_STATUS.CANCELLED]: { bg: "#ffebee", border: "#ffcdd2", text: "#c62828" }
    };

    const colors = statusColors[paymentStatusDetails.status] || statusColors[PAYMENT_STATUS.PROCESSING];

    return (
      <div style={{ 
        marginTop: "20px",
        padding: "15px",
        borderRadius: "8px",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>
            {paymentStatusDetails.status === PAYMENT_STATUS.COMPLETED ? "✓" :
             paymentStatusDetails.status === PAYMENT_STATUS.FAILED ? "✕" :
             paymentStatusDetails.status === PAYMENT_STATUS.PROCESSING ? "⟳" :
             "!"}
          </span>
          <div>
            <p style={{ margin: "0", fontWeight: "500" }}>
              {PAYMENT_MESSAGES[paymentStatusDetails.status]}
            </p>
            {paymentStatusDetails.message && (
              <p style={{ margin: "5px 0 0", fontSize: "14px" }}>
                {paymentStatusDetails.message}
              </p>
            )}
            {paymentStatusDetails.code && (
              <p style={{ margin: "5px 0 0", fontSize: "12px", opacity: 0.7 }}>
                Status Code: {paymentStatusDetails.code}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className="success-container fade-in">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Payment Successful!</h2>
          <p className="success-message">Thank you for your purchase</p>
          <div className="success-details">
            <p>Transaction ID: {transactionId}</p>
            <p>Amount: ₹{total}</p>
          </div>
          <button 
            onClick={onComplete} 
            className="payment-button primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h1 className="payment-title">Payment Details</h1>
          <p className="payment-subtitle">Complete your purchase securely</p>
        </div>

        {paymentError && (
          <div className="payment-status error">
            <span role="img" aria-label="error">⚠️</span>
            {paymentError}
          </div>
        )}

        {networkError && (
          <div className="payment-status error">
            <span role="img" aria-label="error">⚠️</span>
            {networkError}
          </div>
        )}

        {paymentStatusDetails && (
          <div className={`payment-status ${paymentStatusDetails.type}`}>
            <span role="img" aria-label={paymentStatusDetails.type}>
              {paymentStatusDetails.icon}
            </span>
            {paymentStatusDetails.message}
          </div>
        )}

        <div className="payment-section">
          <h2 className="payment-section-title">
            <span role="img" aria-label="order">📦</span>
            Order Summary
          </h2>
          <div className="order-summary">
            {cart.map((item, index) => (
              <div key={index} className="order-item">
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="total-amount">
              <span>Total Amount:</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>

        <div className="payment-section">
          <h2 className="payment-section-title">
            <span role="img" aria-label="payment">💳</span>
            Select Payment Method
          </h2>
          <div className="payment-method-grid">
            <div
              className={`payment-method-card ${paymentMethod === "card" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("card")}
            >
              <h3>💳 Credit/Debit Card</h3>
              <p>Pay using your card</p>
            </div>
            <div
              className={`payment-method-card ${paymentMethod === "upi" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("upi")}
            >
              <h3>📱 UPI Payment</h3>
              <p>Pay using any UPI app</p>
            </div>
            <div
              className={`payment-method-card ${paymentMethod === "netbanking" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("netbanking")}
            >
              <h3>🏦 Net Banking</h3>
              <p>Pay using your bank account</p>
            </div>
            <div
              className={`payment-method-card ${paymentMethod === "wallet" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("wallet")}
            >
              <h3>👛 Digital Wallet</h3>
              <p>Pay using digital wallets</p>
            </div>
            <div
              className={`payment-method-card ${paymentMethod === "qr" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("qr")}
            >
              <h3>📱 QR Code</h3>
              <p>Scan and pay</p>
            </div>
          </div>
        </div>

        {paymentMethod === "card" && (
          <form onSubmit={handleSubmit} className="payment-section">
            <div className="input-group">
              <label>Card Number</label>
              <input
                type="text"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: formatCardNumber(e.target.value)})}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
                className="payment-input"
              />
            </div>
            <div className="input-group">
              <label>Expiry Date</label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                placeholder="MM/YY"
                maxLength="5"
                required
                className="payment-input"
              />
            </div>
            <div className="input-group">
              <label>CVV</label>
              <input
                type="password"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.slice(0, 3)})}
                placeholder="123"
                maxLength="3"
                required
                className="payment-input"
              />
            </div>
            <button 
              type="submit" 
              className="payment-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay ₹" + total}
            </button>
          </form>
        )}

        {paymentMethod === "upi" && (
          <form onSubmit={handleSubmit} className="payment-section">
            <div className="input-group">
              <label>UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                required
                className="payment-input"
              />
            </div>
            <div className="payment-status info">
              <span role="img" aria-label="info">ℹ️</span>
              Pay to: {RECEIVER_UPI_ID}
            </div>
            <button 
              type="submit" 
              className="payment-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay ₹" + total}
            </button>
          </form>
        )}

        {paymentMethod === "netbanking" && (
          <form onSubmit={handleSubmit} className="payment-section">
            <div className="input-group">
              <label>Select Bank</label>
              <select 
                value={netBankingDetails.bank} 
                onChange={(e) => setNetBankingDetails({...netBankingDetails, bank: e.target.value})}
                className="payment-input"
                required
              >
                <option value="">Select your bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
              </select>
            </div>
            <div className="input-group">
              <label>Account Number</label>
              <input
                type="text"
                value={netBankingDetails.accountNumber}
                onChange={(e) => setNetBankingDetails({...netBankingDetails, accountNumber: e.target.value})}
                placeholder="Enter your account number"
                required
                className="payment-input"
              />
            </div>
            <div className="input-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={netBankingDetails.ifsc}
                onChange={(e) => setNetBankingDetails({...netBankingDetails, ifsc: e.target.value})}
                placeholder="Enter IFSC code"
                required
                className="payment-input"
              />
            </div>
            <button 
              type="submit" 
              className="payment-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay ₹" + total}
            </button>
          </form>
        )}

        {paymentMethod === "wallet" && (
          <form onSubmit={handleSubmit} className="payment-section">
            <div className="input-group">
              <label>Select Wallet</label>
              <select 
                value={walletDetails.provider} 
                onChange={(e) => setWalletDetails({...walletDetails, provider: e.target.value})}
                className="payment-input"
                required
              >
                <option value="">Select your wallet</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="amazonpay">Amazon Pay</option>
                <option value="mobikwik">MobiKwik</option>
              </select>
            </div>
            <div className="input-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                value={walletDetails.mobileNumber}
                onChange={(e) => setWalletDetails({...walletDetails, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10)})}
                placeholder="Enter mobile number"
                required
                className="payment-input"
              />
            </div>
            <button 
              type="submit" 
              className="payment-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay ₹" + total}
            </button>
          </form>
        )}

        {paymentMethod === "qr" && (
          <div className="payment-section">
            {showQrCode ? (
              <div className="qr-section">
                <div className="qr-container">
                  <QRCode
                    value={qrValue}
                    size={256}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <div className="payment-status info">
                  <span role="img" aria-label="timer">⏱️</span>
                  QR Code expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <p className="qr-instructions">
                  Scan this QR code with any UPI app to pay ₹{total}
                </p>
              </div>
            ) : (
              <button 
                onClick={() => setShowQrCode(true)} 
                className="payment-button primary"
              >
                Show QR Code
              </button>
            )}
          </div>
        )}

        {showOtp && (
          <div className="payment-section">
            <h2 className="payment-section-title">
              <span role="img" aria-label="otp">🔐</span>
              Enter OTP
            </h2>
            <form onSubmit={handleOtpSubmit}>
              <div className="input-group">
                <label>Enter 6-digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="Enter OTP"
                  maxLength="6"
                  required
                  className="payment-input"
                />
              </div>
              <div className="cart-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowOtp(false)}
                  className="payment-button secondary"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="payment-button primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="cart-buttons">
          <button 
            onClick={onBack} 
            className="payment-button secondary"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
