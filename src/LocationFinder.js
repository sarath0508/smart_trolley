import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';

// Fix for default marker icons in Leaflet with React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for current location and product
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const productLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map center updates
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const LocationFinder = () => {
  const [products, setProducts] = useState([
    // Beverages
    {
      id: 1,
      name: "Coca Cola",
      category: "Beverages",
      price: 35,
      location: {
        aisle: "A",
        shelf: "1",
        rack: "1",
        position: "left",
        coordinates: [12.9716, 77.5946]
      }
    },
    {
      id: 2,
      name: "Fanta",
      category: "Beverages",
      price: 35,
      location: {
        aisle: "A",
        shelf: "1",
        rack: "1",
        position: "center",
        coordinates: [12.9717, 77.5947]
      }
    },
    {
      id: 3,
      name: "Grape Nector Juice",
      category: "Beverages",
      price: 60,
      location: {
        aisle: "A",
        shelf: "1",
        rack: "2",
        position: "left",
        coordinates: [12.9718, 77.5948]
      }
    },
    // Snacks
    {
      id: 4,
      name: "Lays",
      category: "Snacks",
      price: 20,
      location: {
        aisle: "B",
        shelf: "2",
        rack: "1",
        position: "left",
        coordinates: [12.9719, 77.5949]
      }
    },
    {
      id: 5,
      name: "Pringles",
      category: "Snacks",
      price: 90,
      location: {
        aisle: "B",
        shelf: "2",
        rack: "1",
        position: "center",
        coordinates: [12.9720, 77.5950]
      }
    },
    // Personal Care
    {
      id: 6,
      name: "Colgate Toothpaste",
      category: "Personal Care",
      price: 40,
      location: {
        aisle: "C",
        shelf: "3",
        rack: "1",
        position: "left",
        coordinates: [12.9721, 77.5951]
      }
    },
    {
      id: 7,
      name: "Lifebuoy Soap",
      category: "Personal Care",
      price: 25,
      location: {
        aisle: "C",
        shelf: "3",
        rack: "2",
        position: "center",
        coordinates: [12.9722, 77.5952]
      }
    },
    // Confectionery
    {
      id: 8,
      name: "Chocolate Chip",
      category: "Confectionery",
      price: 50,
      location: {
        aisle: "D",
        shelf: "4",
        rack: "1",
        position: "left",
        coordinates: [12.9723, 77.5953]
      }
    },
    {
      id: 9,
      name: "Oreo",
      category: "Confectionery",
      price: 45,
      location: {
        aisle: "D",
        shelf: "4",
        rack: "1",
        position: "center",
        coordinates: [12.9724, 77.5954]
      }
    },
    // Additional Products
    {
      id: 10,
      name: "Fresh Milk",
      category: "Dairy",
      price: 55,
      location: {
        aisle: "E",
        shelf: "1",
        rack: "1",
        position: "left",
        coordinates: [12.9725, 77.5955]
      }
    },
    {
      id: 11,
      name: "Whole Wheat Bread",
      category: "Bakery",
      price: 40,
      location: {
        aisle: "F",
        shelf: "1",
        rack: "1",
        position: "left",
        coordinates: [12.9726, 77.5956]
      }
    },
    {
      id: 12,
      name: "Organic Eggs",
      category: "Dairy",
      price: 120,
      location: {
        aisle: "E",
        shelf: "1",
        rack: "2",
        position: "center",
        coordinates: [12.9727, 77.5957]
      }
    },
    {
      id: 13,
      name: "Fresh Vegetables",
      category: "Produce",
      price: 80,
      location: {
        aisle: "G",
        shelf: "1",
        rack: "1",
        position: "left",
        coordinates: [12.9728, 77.5958]
      }
    },
    {
      id: 14,
      name: "Canned Beans",
      category: "Canned Goods",
      price: 65,
      location: {
        aisle: "H",
        shelf: "2",
        rack: "1",
        position: "left",
        coordinates: [12.9729, 77.5959]
      }
    },
    {
      id: 15,
      name: "Rice",
      category: "Grains",
      price: 150,
      location: {
        aisle: "I",
        shelf: "1",
        rack: "1",
        position: "left",
        coordinates: [12.9730, 77.5960]
      }
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [navigationPath, setNavigationPath] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(18);
  const [routePath, setRoutePath] = useState([]);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({
            coordinates: [latitude, longitude],
            aisle: "Entrance",
            shelf: "0",
            rack: "0",
            position: "center"
          });
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to default location
          setCurrentLocation({
            coordinates: [12.9716, 77.5946],
            aisle: "Entrance",
            shelf: "0",
            rack: "0",
            position: "center"
          });
        }
      );
    }
  }, []); // Empty dependency array as this should only run once

  const calculateRoute = useCallback((start, end) => {
    // Simple straight-line path for demonstration
    // In a real application, you would use a routing service
    const path = [start, end];
    setRoutePath(path);

    // Generate navigation steps
    const steps = [
      `Walk towards Aisle ${end.aisle}`,
      `Go to Shelf ${end.shelf}`,
      `Find Rack ${end.rack}`,
      `Look on the ${end.position} side`,
      `You have reached your destination`
    ];
    setNavigationPath(steps);
  }, []); // Empty dependency array as this function doesn't depend on any props or state

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    if (currentLocation) {
      calculateRoute(
        currentLocation.coordinates,
        product.location.coordinates
      );
    }
  }, [currentLocation, calculateRoute]); // Added dependencies

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="location-finder-container">
      <div className="location-finder-card">
        <div className="location-finder-header">
          <h1 className="location-finder-title">Store Navigation</h1>
          <p className="location-finder-subtitle">Find your products easily</p>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search for a product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="location-finder-content">
          <div className="products-list">
            <h2 className="section-title">
              <span role="img" aria-label="search">🔍</span>
              Available Products
            </h2>
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                  onClick={() => handleProductSelect(product)}
                >
                  <h3>{product.name}</h3>
                  <p>Category: {product.category}</p>
                  <p className="product-location">Aisle: {product.location.aisle}</p>
                </div>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="navigation-section">
              <h2 className="section-title">
                <span role="img" aria-label="location">📍</span>
                Navigation Guide
              </h2>
              
              <div className="store-map">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "400px", width: "100%" }}
                >
                  <ChangeView center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {currentLocation && (
                    <Marker
                      position={currentLocation.coordinates}
                      icon={currentLocationIcon}
                    >
                      <Popup>You are here</Popup>
                    </Marker>
                  )}
                  
                  {selectedProduct && (
                    <Marker
                      position={selectedProduct.location.coordinates}
                      icon={productLocationIcon}
                    >
                      <Popup>{selectedProduct.name}</Popup>
                    </Marker>
                  )}
                  
                  {routePath.length > 0 && (
                    <Polyline
                      positions={routePath}
                      color="#2196f3"
                      weight={3}
                      opacity={0.7}
                    />
                  )}
                </MapContainer>
              </div>

              <div className="product-location-info">
                <h3>{selectedProduct.name}</h3>
                <div className="location-details">
                  <p>Aisle: {selectedProduct.location.aisle}</p>
                  <p>Shelf: {selectedProduct.location.shelf}</p>
                  <p>Rack: {selectedProduct.location.rack}</p>
                  <p>Position: {selectedProduct.location.position}</p>
                </div>
              </div>

              <div className="navigation-steps">
                <h3>How to get there:</h3>
                <ol>
                  {navigationPath.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationFinder; 