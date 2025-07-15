//controllers/authController
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const transporter = require('../config/mail');


// Register a new user
exports.register = async (req, res) => {
  const { 
    email, 
    password, 
    first_name, 
    last_name,
    phone_number,     
    role,
    enterprise_id,  // For existing enterprise
    enterprise,      // For new enterprise
    zones = []       // Zone names to manage
  } = req.body;

  if (!['ADMIN', 'CHEF_PARK', 'PARTICULIER'].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user; // Declare user variable at the top

    const userData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      first_name,
      last_name,
      phone_number,
      role,
      status: role === 'ADMIN' ? 'APPROVED' : 'PENDING'
    };

    // Special handling for CHEF_PARK with enterprise data
    if (role === 'CHEF_PARK') {
      if (enterprise_id){
        // Case 1: Existing enterprise
        user = await handleExistingEnterprise(res, userData, enterprise_id, zones);
      }
      else if (enterprise?.enterprise_name){
        // Case 2: New enterprise
        user = await handleNewEnterprise(res, userData, enterprise, zones);
      }
      else {
        return res.status(400).json({ 
          error: "CHEF_PARK requires enterprise information" 
        });
      }
    }
    else {
      // Regular user registration
      user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone_number:true,
          role: true,
          status: true
        }
      });
      res.status(201).json({
      ...user,
      password: undefined, // Exclude password from response
      message: role === 'ADMIN' 
        ? 'Admin registered' 
        : 'Pending admin approval'
      });
    }
    
    if (user && user.role !== 'ADMIN' && user.status === 'PENDING') {
      // Send approval email to admin
      await transporter.sendMail({
        from: `"Fixiny Platform" <${user.email}>`,
        to: process.env.ADMIN_EMAIL, // or fetch from DB
        subject: 'New User Approval Request',
        html: `
          <h2>New User Registration</h2>
          <p>A new user requires approval:</p>
          <ul>
            <li>Name: ${user.first_name} ${user.last_name}</li>
            <li>Email: ${user.email}</li>
            <li>Role: ${user.role}</li>
          </ul>
          <p>
            <a href="${process.env.APP_URL}/users">
              Click here to review
            </a>
          </p>
        `
      });

      // Send confirmation email to user
      await transporter.sendMail({
        from: `"Fixiny Platform" <${process.env.ADMIN_EMAIL}>`,
        to: user.email,
        subject: 'Registration Received',
        html: `
          <h2>Thank you for registering!</h2>
          <p>Your account is pending admin approval.</p>
          <p>You'll receive an email when your account is activated.</p>
        `
      });
    }
    
  } catch (err) {
    console.error("Registration Error:", err);    
    if (err.code === 'P2002') {
      res.status(400).json({ 
        error: "Registration failed",
        details: `${err.meta?.target?.[0] || 'Field'} already exists`
      });
    } else {
      res.status(500).json({ 
        error: "Registration error",
        details: err.message 
      });
    }
  }
};


async function handleExistingEnterprise(res, userData, enterpriseId, zones) {
  try {
    // 1. Verify enterprise exists
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: enterpriseId },
      include: { zones: true }
    });
    if (!enterprise) return res.status(404).json({ error: "Enterprise not found" });

    // 2. Check for zone conflicts
    const conflicts = [];
    for (const zone_name of zones) {
      const existingZone = enterprise.zones.find(z => z.zone_name === zone_name);
      if (existingZone) {
        conflicts.push({
          zone_name,
          current_chef: existingZone.chef_park_id
        });
      }
    }
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        error: "Zone management conflict",
        message: "Some zones are already managed by other users",
        conflicts
      });
    }

    // 3. Create user and zones in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          ...userData,
          enterprise_id: enterpriseId
        }
      });

      // Create zones
      await tx.zone.createMany({
        data: zones.map(zone_name => ({
          zone_name,
          enterprise_id: enterpriseId,
          chef_park_id: user.id
        }))
      });

      return user;
    });

    // 4. Return complete user data
    const completeUser = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        enterprise: true,
        zones: true
      }
    });

    res.status(201).json({
      ...completeUser,
      password: undefined,
      message: "CHEF_PARK registered successfully"
    });

    return completeUser;

  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 'P2002') {
      res.status(400).json({ 
        error: "Registration failed",
        details: `${err.meta?.target?.[0] || 'Field'} already exists`
      });
    } else {
      res.status(500).json({ 
        error: "Registration error",
        details: err.message 
      });
    }
  }
}

// CHEF_PARK with new enterprise
async function handleNewEnterprise(res, userData, enterpriseData, zones) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create enterprise
      const enterprise = await tx.enterprise.create({
        data: {
          enterprise_name: enterpriseData.enterprise_name,
          description: enterpriseData.description
        }
      });

      // 2. Create user
      const user = await tx.user.create({
        data: {
          ...userData,
          enterprise_id: enterprise.id
        }
      });

      // 3. Create zones
      await tx.zone.createMany({
        data: zones.map(zone_name => ({
          zone_name,
          enterprise_id: enterprise.id,
          chef_park_id: user.id
        }))
      });

      return { enterprise, user };
    });

    // 4. Return complete data
    const completeUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        enterprise: true,
        zones: true
      }
    });

    res.status(201).json({
      ...completeUser,
      password: undefined,
      message: "Enterprise and CHEF_PARK registered successfully"
    });

    return completeUser;

  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 'P2002') {
      const target = err.meta?.target?.[0];
      res.status(400).json({ 
        error: "Registration failed",
        details: target === 'enterprise_name' 
          ? "Enterprise name already exists" 
          : "Zone already exists in this enterprise"
      });
    } else {
      res.status(500).json({ 
        error: "Registration error",
        details: err.message 
      });
    }
  }
}

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Block unapproved users (except admins who auto-approve)
    if ((user.status == 'REJECTED' || user.status == 'PENDING') && user.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: "Account pending approval",
        details: "An admin must approve your account before login"
      });

    }    

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        status: user.status,
        enterprise_id: user?.enterprise_id 
      },
      process.env.JWT_SECRET, // Make sure this matches your .env
      { expiresIn: '3h' }
    );

    const isMobileClient = req.headers['x-client-type'] === 'mobile';
    if (isMobileClient) {
      return res.json({
        token, // Only for mobile clients
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          role: user.role,
          status: user.status,
          enterprise_id: user?.enterprise_id
        }
      });

    } else {
      // 4. Set cookie and respond
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10800000
      });

      res.json({ 
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.role,
        status: user.status,
        enterprise_id: user?.enterprise_id      
      });
    }    

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};
// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await prisma.user.findUnique({ 
//       where: { email: email.toLowerCase().trim() } 
//     });

//     if (!user) return res.status(401).json({ error: "Invalid credentials" });

//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

//     if ((user.status == 'REJECTED' || user.status == 'PENDING') && user.role !== 'ADMIN') {
//       return res.status(403).json({ 
//         error: "Account pending approval",
//         details: "An admin must approve your account before login"
//       });
//     }

//     const token = jwt.sign(
//       { 
//         id: user.id, 
//         role: user.role,
//         status: user.status,
//         enterprise_id: user?.enterprise_id 
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '3h' }
//     );

//     // Always return JSON (even for web)
//     const userData = {
//       id: user.id,
//       email: user.email,
//       first_name: user.first_name,
//       last_name: user.last_name,
//       phone_number: user.phone_number,
//       role: user.role,
//       status: user.status,
//       enterprise_id: user?.enterprise_id      
//     };

//     if (req.headers['x-client-type'] === 'mobile') {
//       return res.json({ token, user: userData });
//     } else {
//       res.cookie('token', token, { 
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 10800000
//       });
//       return res.json(userData); // Critical change: Always return JSON
//     }

//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json({ error: "Login failed" }); // Explicit return
//   }
// };

// Logout user
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Successfully logged out' });
};
