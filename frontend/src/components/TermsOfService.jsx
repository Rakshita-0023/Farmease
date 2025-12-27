import './WeatherEnhancements.css'

const TermsOfService = () => {
  return (
    <div className="terms-page">
      <div className="page-header">
        <h1>📋 Terms of Service</h1>
        <p>Last updated: December 26, 2024</p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using FarmEase, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Service Description</h2>
          <p>
            FarmEase provides agricultural technology services including but not limited to:
          </p>
          <ul>
            <li>Weather forecasting and agricultural alerts</li>
            <li>Plant disease detection and treatment recommendations</li>
            <li>Market price information and trends</li>
            <li>Farm management tools and analytics</li>
            <li>Community forum for farmers</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. User Responsibilities</h2>
          <p>Users agree to:</p>
          <ul>
            <li>Provide accurate and truthful information</li>
            <li>Use the service for lawful agricultural purposes only</li>
            <li>Respect other users in community interactions</li>
            <li>Not attempt to hack, reverse engineer, or misuse the platform</li>
            <li>Keep login credentials secure and confidential</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Data and Privacy</h2>
          <p>
            We collect and process data to improve our services. This includes:
          </p>
          <ul>
            <li>Farm location and crop information for personalized recommendations</li>
            <li>Usage patterns to enhance user experience</li>
            <li>Images uploaded for disease detection (processed securely)</li>
            <li>Community posts and interactions</li>
          </ul>
          <p>
            We do not sell personal data to third parties. Data is used solely for 
            service improvement and agricultural research.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            FarmEase provides information and tools "as is" without warranty of any kind. 
            While we strive for accuracy, agricultural decisions should consider multiple 
            factors and local expertise. We are not liable for crop losses or damages 
            resulting from use of our recommendations.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            FarmEase shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages, including without limitation, loss of 
            profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are and 
            will remain the exclusive property of FarmEase and its licensors. The 
            service is protected by copyright, trademark, and other laws.
          </p>
        </section>

        <section className="terms-section">
          <h2>8. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the service 
            immediately, without prior notice or liability, under our sole discretion, 
            for any reason whatsoever including breach of terms.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these terms at any time. If a 
            revision is material, we will provide at least 30 days notice prior to 
            any new terms taking effect.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@farmease.com</li>
            <li>Phone: +91 1800-FARM-EASE</li>
            <li>Address: Agricultural Technology Center, New Delhi, India 110001</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>11. Governing Law</h2>
          <p>
            These terms shall be interpreted and governed in accordance with the laws 
            of India, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>

      <div className="terms-footer">
        <p>
          By continuing to use FarmEase, you acknowledge that you have read, 
          understood, and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  )
}

export default TermsOfService