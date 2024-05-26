// import ffrom packages
const express = require("express");
const mongoose = require("mongoose");
//cors
const cors = require("cors");
//import from files
const authRouter = require("./routes/auth");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { sendMessage } = require("./routes/messages");

const adminRouter = require("./routes/admin");
const propertyRouter = require("./routes/property");
const userRouter = require("./routes/user");
const orderRouter = require("./routes/order");
const notificationRouter = require("./routes/notification");
const Message = require("./models/messages");


//init
const PORT = 5123;
const DB =
  "mongodb+srv://bistsaniya:2076Asoj21!@cluster0.kfmu6iu.mongodb.net/?retryWrites=true";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

//middleware
app.use(express.json());
app.use(cors());
app.use(authRouter);
app.use(adminRouter);
app.use(propertyRouter);
app.use(userRouter);
app.use(orderRouter);
app.use(notificationRouter);

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Send a new message
// app.post("/messages", async (req, res) => {
//   try {
//     const { sender, text } = req.body;
//     const newMessage = new Message({
//       sender,
//       text,
//     });
//     await newMessage.save();
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error sending message:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/messages", sendMessage);

// Database connection
mongoose
  .connect(DB)
  .then(() => {
    console.log('Connection successful');
  })
  .catch((e) => {
    console.log('Database connection error:', e);
  });

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('a user connected');

  // Send last 50 messages to the newly connected client
  socket.on('get messages', async () => {
    try {
      const messages = await Message.find().populate('sender', 'name email').sort({ timestamp: -1 }).limit(50);
      socket.emit('messages', messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', async (msg) => {
    try {
      const savedMessage = await sendMessage(msg);
      io.emit('chat message', savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`conected at port ${PORT}`);
});
