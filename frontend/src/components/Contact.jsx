import { useState } from 'react'
import './WeatherEnhancements.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 1000)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (submitted) {
    return (
      <div className="contact-page">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Message Sent Successfully!</h2>
          <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
          <button 
            className="primary-btn"
            onClick={() => setSubmitted(false)}
          >
            Send Another Message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-page">
      <div className="page-header">
        <h1>📞 Contact Us</h1>
        <p>Get in touch with our agricultural experts</p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <div className="contact-card">
            <div className="contact-icon">📧</div>
            <h3>Email Support</h3>
            <p>support@farmease.com</p>
            <p>Available 24/7 for technical issues</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon">📱</div>
            <h3>Phone Support</h3>
            <p>+91 1800-FARM-EASE</p>
            <p>Mon-Fri: 9 AM - 6 PM IST</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon">📍</div>
            <h3>Office Address</h3>
            <p>Agricultural Technology Center</p>
            <p>New Delhi, India 110001</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon">💬</div>
            <h3>Community Forum</h3>
            <p>Join our farmer community</p>
            <p>Get help from fellow farmers</p>
          </div>
        </div>

        <div className="contact-form-container">
          <h2>Send us a Message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />

            <textarea
              name="message"
              placeholder="Your Message"
              rows="6"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>How accurate is the weather forecast?</h3>
            <p>Our weather data is sourced from OpenWeatherMap with 85-90% accuracy for 3-day forecasts.</p>
          </div>
          <div className="faq-item">
            <h3>Is the plant disease detection reliable?</h3>
            <p>Our AI model has 92% accuracy rate and is continuously improving with more data.</p>
          </div>
          <div className="faq-item">
            <h3>How often are market prices updated?</h3>
            <p>Market prices are updated every 6 hours from verified agricultural market sources.</p>
          </div>
          <div className="faq-item">
            <h3>Is FarmEase free to use?</h3>
            <p>Basic features are free. Premium features include advanced analytics and expert consultations.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact