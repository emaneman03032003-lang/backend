// /**
//  * MongoDB Connection Configuration
//  *
//  * Establishes connection to MongoDB Atlas database
//  * - Uses environment variable MONGODB_URI
//  * - Fallback to local MongoDB if MONGODB_URI not set
//  * - Implements Mongoose with modern connection options
//  * - Error handling with process exit on failure
//  * - Enhanced diagnostics for troubleshooting
//  */

// const mongoose = require('mongoose');
// const dotenv = require('dotenv');

// dotenv.config();

// const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/gnsons';

// const connectDB = async () => {
//   let retries = 3;
//   let lastError;

//   while (retries > 0) {
//     try {
//       console.log(`🔄 Attempting MongoDB connection (${4 - retries}/3)...`);
//       console.log(`📍 Database: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`); // Hide password in logs

//       await mongoose.connect(MONGODB_URI, {
//         // Parser options
//         useNewUrlParser: true,
//         useUnifiedTopology: true,

//         // Connection timing (for Atlas)
//         serverSelectionTimeoutMS: 10000, // Wait 10s for server selection
//         socketTimeoutMS: 45000, // Wait 45s for socket operations
//         maxPoolSize: 10, // Connection pool size
//         minPoolSize: 2,

//         // Retry logic
//         retryWrites: true,
//         retryReads: true,

//         // Connection string options
//         appName: 'GN-SONS-Backend',
//       });

//       console.log('✅ MongoDB Atlas connected successfully');
//       console.log(`📊 Database: ${mongoose.connection.name}`);
//       console.log(`🌐 Host: ${mongoose.connection.host}`);
//       return; // Success - exit retry loop

//     } catch (error) {
//       lastError = error;
//       retries--;
//       console.error(`❌ Connection attempt failed: ${error.message}`);

//       // Diagnose the issue
//       if (error.message.includes('getaddrinfo')) {
//         console.error('💡 DNS resolution issue - check internet connection');
//       } else if (error.message.includes('authentication')) {
//         console.error('💡 Authentication failed - verify username/password in MONGODB_URI');
//       } else if (error.message.includes('IP')) {
//         console.error('💡 IP not whitelisted - add your IP to MongoDB Atlas Security > Network Access');
//       } else if (error.message.includes('ECONNREFUSED')) {
//         console.error('💡 Connection refused - check if MongoDB is running');
//       }

//       if (retries > 0) {
//         const waitTime = (4 - retries) * 2; // 2s, 4s, 6s
//         console.log(`⏳ Retrying in ${waitTime}s...`);
//         await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
//       }
//     }
//   }

//   // All retries exhausted
//   console.error('\n❌ FAILED TO CONNECT TO MONGODB');
//   console.error('========================================');
//   console.error('Troubleshooting steps:');
//   console.error('1. Check MongoDB Atlas IP Whitelist:');
//   console.error(' - Go to: https://cloud.mongodb.com/v2');
//   console.error(' - Select Project → Security → Network Access');
//   console.error(' - Ensure 0.0.0.0/0 is added (development) or your IP is whitelisted');
//   console.error('2. Verify connection string in .env file');
//   console.error('3. Check username and password');
//   console.error('4. Test connection with MongoDB Compass');
//   console.error('5. Ensure internet connection is active');
//   console.error('========================================\n');

//   process.exit(1);
// };

// module.exports = connectDB;











const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const connectDB = async () => {
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      console.log(`🔄 Attempting MongoDB connection (${4 - retries}/3)...`);
      console.log(`📍 Connection String: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`); // Hide password

      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 8000, // 8 seconds
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
        appName: 'GN-SONS-Backend',
        family: 4 // Force IPv4 (helps with VPN/network issues)
      });

      console.log('✅ MongoDB Atlas connected successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}`);
      return true;

    } catch (error) {
      lastError = error;
      retries--;
      console.error(`\n❌ Connection attempt ${4 - retries} failed: ${error.message}`);

      // Detailed diagnostics
      if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('💡 Network/DNS Issue Detected');
        console.error('   Possible causes:');
        console.error('   • Internet connection is down');
        console.error('   • VPN is blocking the connection');
        console.error('   • Firewall is blocking port 27017');
        console.error('   • DNS cannot resolve MongoDB server');
        console.error('\n   Quick fixes:');
        console.error('   1. Check your internet connection');
        console.error('   2. If using VPN, try disabling it');
        console.error('   3. Restart your computer');
        console.error('   4. Try from a different network');
      } else if (error.message.includes('auth') || error.message.includes('authentication')) {
        console.error('💡 Authentication Issue');
        console.error('   Check username/password in MONGODB_URI');
      } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
        console.error('💡 IP Whitelist Issue');
        console.error('   Add your IP to MongoDB Atlas → Security → Network Access');
      }

      if (retries > 0) {
        const waitTime = (4 - retries) * 3;
        console.log(`⏳ Retrying in ${waitTime}s... (${retries} attempts left)\n`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
    }
  }

  // All retries exhausted
  console.error('\n' + '='.repeat(50));
  console.error('❌ FAILED TO CONNECT TO MONGODB AFTER 3 ATTEMPTS');
  console.error('='.repeat(50));
  console.error('\nTroubleshooting Checklist:');
  console.error('1. ✓ Check internet connection');
  console.error('2. ✓ Verify MongoDB URI in .env file');
  console.error('3. ✓ Disable VPN if active');
  console.error('4. ✓ Check MongoDB Atlas whitelist:');
  console.error('     https://cloud.mongodb.com → Security → Network Access');
  console.error('     Add 0.0.0.0/0 (for development)');
  console.error('5. ✓ Test connection with MongoDB Compass');
  console.error('6. ✓ Check Windows Firewall settings');
  console.error('7. ✓ Restart computer');
  console.error('='.repeat(50) + '\n');

  throw lastError;
};

module.exports = connectDB;
