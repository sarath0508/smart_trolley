import React, { useState, useEffect } from 'react';
import './styles.css';

const OffersPage = ({ currentProduct = null, cart = [] }) => {
  const [offers, setOffers] = useState([
    {
      id: 1,
      title: "Buy 2 Get 1 Free on Beverages",
      description: "Get one free beverage when you buy any two from Coca Cola, Fanta, or Grape Nector Juice",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "33%",
      applicableProducts: ["Coca Cola", "Fanta", "Grape Nector Juice"],
      category: "Beverages"
    },
    {
      id: 2,
      title: "Snack Attack Combo",
      description: "Buy any 2 snacks (Lays, Pringles) and get 20% off on the total",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "20%",
      applicableProducts: ["Lays", "Pringles"],
      category: "Snacks"
    },
    {
      id: 3,
      title: "Personal Care Bundle",
      description: "Get 15% off when you buy Colgate Toothpaste and Lifebuoy Soap together",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "15%",
      applicableProducts: ["Colgate Toothpaste", "Lifebuoy Soap"],
      category: "Personal Care"
    },
    {
      id: 4,
      title: "Sweet Treats Offer",
      description: "Buy Chocolate Chip and Oreo together to get 25% off",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "25%",
      applicableProducts: ["Chocolate Chip", "Oreo"],
      category: "Confectionery"
    },
    {
      id: 5,
      title: "Dairy Delight",
      description: "Get 10% off on Fresh Milk and Organic Eggs combo",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "10%",
      applicableProducts: ["Fresh Milk", "Organic Eggs"],
      category: "Dairy"
    },
    {
      id: 6,
      title: "Fresh Produce Special",
      description: "Buy Fresh Vegetables worth ₹200 and get 15% off",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "15%",
      applicableProducts: ["Fresh Vegetables"],
      category: "Produce"
    },
    {
      id: 7,
      title: "Bakery Bundle",
      description: "Get Whole Wheat Bread at 20% off when you buy any dairy product",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "20%",
      applicableProducts: ["Whole Wheat Bread"],
      category: "Bakery"
    },
    {
      id: 8,
      title: "Grains & Canned Goods Combo",
      description: "Buy Rice and Canned Beans together to get 15% off",
      image: "/placeholder-images-image_large.webp",
      validity: "2024-03-31",
      discount: "15%",
      applicableProducts: ["Rice", "Canned Beans"],
      category: "Grains"
    }
  ]);

  const [productOffers, setProductOffers] = useState([]);
  const [cartOffers, setCartOffers] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    if (currentProduct) {
      const applicableOffers = offers.filter(offer => 
        offer.applicableProducts.includes(currentProduct.name)
      );
      setProductOffers(applicableOffers);
    }
  }, [currentProduct, offers]);

  useEffect(() => {
    // Calculate applicable offers for cart items
    const applicableCartOffers = offers.filter(offer => {
      const cartProductNames = cart.map(item => item.name);
      return offer.applicableProducts.some(product => 
        cartProductNames.includes(product)
      );
    });

    // Calculate savings for each offer
    const offersWithSavings = applicableCartOffers.map(offer => {
      let savings = 0;
      const applicableItems = cart.filter(item => 
        offer.applicableProducts.includes(item.name)
      );

      if (offer.type === 'combo' && applicableItems.length >= offer.minQuantity) {
        const freeItems = Math.floor(applicableItems.length / offer.minQuantity);
        savings = freeItems * applicableItems[0].price;
      } else if (offer.type === 'percentage' && applicableItems.length >= offer.minQuantity) {
        savings = applicableItems.reduce((total, item) => 
          total + (item.price * item.quantity * (parseInt(offer.discount) / 100)), 0
        );
      } else if (offer.type === 'bulk' && applicableItems.length >= offer.minQuantity) {
        savings = applicableItems.reduce((total, item) => 
          total + (item.price * item.quantity * (parseInt(offer.discount) / 100)), 0
        );
      }

      return {
        ...offer,
        savings,
        applicableItems
      };
    });

    setCartOffers(offersWithSavings);
    setTotalSavings(offersWithSavings.reduce((total, offer) => total + offer.savings, 0));
  }, [cart, offers]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="offers-container">
      <div className="offers-card">
        <div className="offers-header">
          <h1 className="offers-title">Available Offers</h1>
          <p className="offers-subtitle">Find the best deals and discounts</p>
        </div>

        {cart.length > 0 && (
          <div className="cart-offers-section">
            <h2 className="section-title">
              <span role="img" aria-label="cart">🛒</span>
              Your Cart Savings
            </h2>
            <div className="cart-savings-summary">
              <h3>Total Savings: ₹{totalSavings.toFixed(2)}</h3>
            </div>
            <div className="offers-grid">
              {cartOffers.map(offer => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-image">
                    <img src={offer.image} alt={offer.title} />
                    <div className="discount-badge">{offer.discount} OFF</div>
                  </div>
                  <div className="offer-content">
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>
                    <div className="offer-details">
                      <p>Applicable Items:</p>
                      <ul>
                        {offer.applicableItems.map(item => (
                          <li key={item.name}>
                            {item.name} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                      <p className="savings">You save: ₹{offer.savings.toFixed(2)}</p>
                    </div>
                    <div className="offer-validity">
                      Valid until: {formatDate(offer.validUntil)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentProduct && (
          <div className="product-offers-section">
            <h2 className="section-title">
              <span role="img" aria-label="gift">🎁</span>
              Offers for {currentProduct.name}
            </h2>
            <div className="offers-grid">
              {productOffers.map(offer => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-image">
                    <img src={offer.image} alt={offer.title} />
                    <div className="discount-badge">{offer.discount} OFF</div>
                  </div>
                  <div className="offer-content">
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>
                    <div className="offer-validity">
                      Valid until: {formatDate(offer.validUntil)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="all-offers-section">
          <h2 className="section-title">
            <span role="img" aria-label="star">⭐</span>
            All Available Offers
          </h2>
          <div className="offers-grid">
            {offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-image">
                  <img src={offer.image} alt={offer.title} />
                  <div className="discount-badge">{offer.discount} OFF</div>
                </div>
                <div className="offer-content">
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                  <div className="offer-details">
                    <p>Applicable Products:</p>
                    <ul>
                      {offer.applicableProducts.map(product => (
                        <li key={product}>{product}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="offer-validity">
                    Valid until: {formatDate(offer.validUntil)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersPage; 