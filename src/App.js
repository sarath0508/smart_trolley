import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import PaymentPage from "./PaymentPage";
import OffersPage from "./OffersPage";
import LocationFinder from "./LocationFinder";
import "./styles.css";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Product price map
const PRODUCTS = {
  "Grape nector juice": 60,
  "Colgate toothpaste": 40,
  "Lifebuoy soap": 25,
  "Pringles": 90,
  "Lays": 20,
  "Coca Cola": 35,
  "Fanta": 35,
  "Chocolate Chip": 50,
  "oreo": 45,
};

const App = () => {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [topPrediction, setTopPrediction] = useState("");
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const lastDetectedRef = useRef(null);
  const lastDetectedTimeRef = useRef(0);
  const streamRef = useRef(null);

  const modelURL = process.env.PUBLIC_URL + "/model/";

  // Load Teachable Machine model
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        console.log("Loading model from:", modelURL);
        const loadedModel = await tmImage.load(
          modelURL + "model.json",
          modelURL + "metadata.json"
        );
        if (isMounted) {
          console.log("Model loaded successfully:", loadedModel);
          setModel(loadedModel);
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error("Error loading model:", error);
        if (isMounted) {
          setIsModelLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [modelURL]);

  // Camera setup and prediction loop
  useEffect(() => {
    if (!model || !videoRef.current) return;

    let isPredicting = true;

    const setupCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) {
            resolve();
          } else {
            videoRef.current.onloadeddata = () => resolve();
          }
        });

        console.log("Camera setup successful");
        setCameraError(null);
        requestAnimationFrame(predictLoop);
      } catch (err) {
        console.error("Camera access denied or error:", err);
        setCameraError("Camera access denied. Please allow camera access to use this feature.");
      }
    };

    const predictLoop = async () => {
      if (!isPredicting || !videoRef.current || !model) return;

      try {
        if (videoRef.current.readyState === 4) {
          const prediction = await model.predict(videoRef.current);
          const top = prediction.reduce((max, p) =>
            p.probability > max.probability ? p : max
          );

          const cleanedClassName = top.className.trim();
          const now = Date.now();

          if (
            top.probability > 0.98 &&
            cleanedClassName.toLowerCase() !== "fanta" &&
            cleanedClassName.toLowerCase() !== "background" &&
            cleanedClassName.toLowerCase() !== "nothing"
          ) {
            if (
              cleanedClassName !== lastDetectedRef.current ||
              now - lastDetectedTimeRef.current > 3000
            ) {
              setTopPrediction(cleanedClassName);

              if (PRODUCTS.hasOwnProperty(cleanedClassName)) {
                addToCart(cleanedClassName);
                lastDetectedRef.current = cleanedClassName;
                lastDetectedTimeRef.current = now;
              } else {
                console.warn(`Unknown item detected: "${cleanedClassName}"`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Prediction error:", error);
      }

      if (isPredicting) {
        requestAnimationFrame(predictLoop);
      }
    };

    setupCamera();

    return () => {
      isPredicting = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [model]);

  // Add item to cart
  const addToCart = (item) => {
    const price = PRODUCTS[item];
    if (price === undefined) return;

    setCart((prevCart) => {
      const existing = prevCart.find((p) => p.name === item);
      if (existing) {
        return prevCart.map((p) =>
          p.name === item ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        return [...prevCart, { name: item, price, quantity: 1 }];
      }
    });
  };

  // Clear cart
  const clearCart = () => setCart([]);

  // Total cost
  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePaymentComplete = () => {
    setCart([]);
    setShowPayment(false);
  };

  if (showPayment) {
    return (
      <PaymentPage
        cart={cart}
        total={getTotal()}
        onBack={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <Router>
      <div className="app-container">
        <nav className="app-nav">
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/offers" className="nav-link">Offers</Link>
            <Link to="/location-finder" className="nav-link">Find Products</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            <div className="app-container">
              <div className="app-header">
                <h1 className="app-title">Smart Shopping Cart System</h1>
              </div>

              {isModelLoading && (
                <div className="payment-status info">
                  <span role="img" aria-label="loading">⟳</span>
                  Loading model...
                </div>
              )}

              {cameraError && (
                <div className="payment-status error">
                  <span role="img" aria-label="error">⚠️</span>
                  {cameraError}
                </div>
              )}

              <div className="app-content">
                <div className="camera-section">
                  <video
                    ref={videoRef}
                    className="camera-video"
                    autoPlay
                    muted
                    playsInline
                  />
                  <h3 className="payment-section-title">
                    Detected: <span style={{ color: "var(--primary)" }}>{topPrediction || "None"}</span>
                  </h3>
                </div>

                <div className="cart-section">
                  <h2 className="cart-title">🛒 Cart</h2>
                  {cart.length === 0 ? (
                    <p>No items yet</p>
                  ) : (
                    <table className="cart-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price}</td>
                            <td>₹{item.price * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <h3 className="cart-total">Total: ₹{getTotal()}</h3>

                  <div className="cart-buttons">
                    <button 
                      onClick={clearCart} 
                      className="payment-button secondary"
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={() => setShowPayment(true)}
                      disabled={cart.length === 0}
                      className="payment-button primary"
                      style={{ opacity: cart.length === 0 ? 0.7 : 1 }}
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/location-finder" element={<LocationFinder />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
