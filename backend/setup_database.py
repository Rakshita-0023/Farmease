import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def create_database():
    """Create the farmease database if it doesn't exist"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', '')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database
            cursor.execute("CREATE DATABASE IF NOT EXISTS farmease")
            print("✅ Database 'farmease' created successfully")
            
            # Use the database
            cursor.execute("USE farmease")
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    location VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✅ Users table created successfully")
            
            # Create farms table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS farms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    crop_type VARCHAR(50) NOT NULL,
                    soil_type VARCHAR(50) NOT NULL,
                    area DECIMAL(10,2) NOT NULL,
                    sowing_date DATE NOT NULL,
                    status VARCHAR(50) DEFAULT 'Growing',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ''')
            print("✅ Farms table created successfully")
            
            # Create growth_data table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS growth_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    farm_id INT,
                    week_number INT,
                    progress DECIMAL(5,2),
                    soil_moisture DECIMAL(5,2),
                    rainfall DECIMAL(5,2),
                    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
                )
            ''')
            print("✅ Growth data table created successfully")
            
            # Create irrigation_logs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS irrigation_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    farm_id INT,
                    amount DECIMAL(5,2),
                    method VARCHAR(50),
                    notes TEXT,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
                )
            ''')
            print("✅ Irrigation logs table created successfully")
            
            connection.commit()
            print("\n🎉 Database setup completed successfully!")
            print("You can now run the Flask application with: python app.py")
            
    except Error as e:
        print(f"❌ Error while connecting to MySQL: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure MySQL is running")
        print("2. Check your MySQL credentials in .env file")
        print("3. Ensure MySQL user has CREATE DATABASE privileges")
        
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("🚀 Setting up FarmEase database...")
    create_database()