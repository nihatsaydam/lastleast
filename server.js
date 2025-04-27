// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// MongoDB Atlas bağlantısı
mongoose
  .connect(
    'mongodb+srv://nihatsaydam13131:nihat1234@keepsty.hrq40.mongodb.net/GreenP?retryWrites=true&w=majority&appName=Keepsty'
  )
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// CORS yapılandırması güncellendi
app.use(cors({
  origin: '*', // Tüm domainlerden gelen isteklere izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));
const nodemailer = require('nodemailer');

// SMTP ayarlarınızı buraya ekleyin (örneğin, Gmail, SendGrid, vs.)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // 465 için true, 587 için false
  auth: {
    user: 'nihatsaydam13131@gmail.com',
    pass: 'jgmp pons oxpc saxl'
  }
});
const housekeepingCleanSchema = new mongoose.Schema({
  cleaningOption: { type: String, required: true },
  username: { type: String, required: true },
  roomNumber: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'completed'], 
    default: 'waiting' 
  }
});
const HousekeepingClean = mongoose.model('HousekeepingClean', housekeepingCleanSchema, 'housekeepingclean');

// POST endpoint: Yeni temizlik kaydı oluşturma ve e-posta gönderimi
app.post('/save-cleaning-option', async (req, res) => {
  try {
    const { cleaningOption, username, roomNumber, timestamp, status } = req.body;

    const newRecord = new HousekeepingClean({
      cleaningOption,
      username,
      roomNumber,
      timestamp: timestamp || new Date(),
      status: status || 'waiting'
    });

    const savedRecord = await newRecord.save();

    // E-posta içeriğini oluşturma
    const mailOptions = {
      from: '"Housekeeping Uygulaması" <nihatsaydam13131@gmail.com>',
      to: 'nihat.saydam@icloud.com',  // Bildirimi almak istediğiniz e-posta adresi
      subject: 'Yeni Temizlik Kaydı Oluşturuldu',
      text: `Yeni bir temizlik kaydı oluşturuldu.
Kullanıcı: ${username}
Oda: ${roomNumber}
Temizlik Seçeneği: ${cleaningOption}
Durum: ${status || 'waiting'}
Tarih: ${new Date(timestamp || Date.now()).toLocaleString()}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('E-posta gönderim hatası:', error);
      } else {
        console.log('E-posta gönderildi:', info.response);
      }
    });

    res.status(201).json(savedRecord);
  } catch (error) {
    console.error("Kayıt oluşturma hatası:", error);
    res.status(500).json({ message: 'Temizlik kaydı oluşturulamadı', error });
  }
});

// GET endpoint: Tüm temizlik kayıtlarını listeleme
app.get('/cleaning-records', async (req, res) => {
  try {
    const records = await HousekeepingClean.find();
    res.json(records);
  } catch (error) {
    console.error("Kayıt getirme hatası:", error);
    res.status(500).json({ message: 'Kayıtlar getirilemedi', error });
  }
});

// PATCH endpoint: Temizlik kaydı durumunu güncelleme (waiting, active, completed)
app.patch('/cleaning-records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['waiting', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum değeri' });
    }
    
    const updatedRecord = await HousekeepingClean.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Kayıt bulunamadı' });
    }
    res.json(updatedRecord);
  } catch (error) {
    console.error("Kayıt güncelleme hatası:", error);
    res.status(500).json({ message: 'Kayıt güncellenemedi', error });
  }
});

/* ============================
   Cart Orders Sepet Siparişleri
============================ */
const cartOrderSchema = new mongoose.Schema({
  username: { type: String, required: true },
  roomNumber: { type: String, required: true },
  cartItems: { type: Array, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'completed'], 
    default: 'waiting' 
  },
  timestamp: { type: Date, default: Date.now }
});
const CartOrder = mongoose.model('CartOrder', cartOrderSchema, 'cartOrders');


app.post('/save-cart', async (req, res) => {
  try {
    const { username, roomNumber, cartItems } = req.body;
    if (!username || !roomNumber || !cartItems) {
      return res.status(400).json({ message: 'Eksik alanlar var.' });
    }
    // Yeni sipariş oluşturulurken status belirtilmediğinde otomatik olarak "waiting" olacaktır.
    const newCartOrder = new CartOrder({ username, roomNumber, cartItems });
    const savedOrder = await newCartOrder.save();

    // Sepet ürünlerini string haline getir
    const itemsString = cartItems
      .map(item => `${item.name} (Miktar: ${item.quantity}, Fiyat: ${item.price})`)
      .join(', ');

    // E-posta içeriğini oluşturma
    const mailOptions = {
      from: '"Cart Orders Uygulaması" <nihatsaydam13131@gmail.com>',
      to: 'nihat.saydam@icloud.com',  // Bildirimi almak istediğiniz e-posta adresi
      subject: 'Yeni Sepet Siparişi Geldi',
      text: `Yeni bir sepet siparişi alındı.
Oda: ${roomNumber}
Kullanıcı: ${username}
Ürünler: ${itemsString}
Tarih: ${new Date().toLocaleString()}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('E-posta gönderim hatası:', error);
      } else {
        console.log('E-posta gönderildi:', info.response);
      }
    });

    res.status(201).json({ message: "Cart saved", result: savedOrder });
  } catch (error) {
    console.error("Error saving cart:", error);
    res.status(500).json({ message: "Error saving cart", error });
  }
});
app.put('/update-cart-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CartOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Mevcut duruma göre sıradaki durumu belirleyelim
    let nextStatus;
    if (order.status === 'waiting') {
      nextStatus = 'active';
    } else if (order.status === 'active') {
      nextStatus = 'completed';
    } else if (order.status === 'completed') {
      return res.status(400).json({ message: "Order is already completed" });
    }

    order.status = nextStatus;
    const updatedOrder = await order.save();
    res.json({ message: "Status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating cart status:", error);
    res.status(500).json({ message: "Error updating cart status", error });
  }
});

app.get('/cart-orders', async (req, res) => {
  try {
    const { roomNumber, status } = req.query;
    let query = {};
    if (roomNumber) {
      query.roomNumber = roomNumber;
    }
    if (status) {
      query.status = status;
    }
    const orders = await CartOrder.find(query);
    res.json({ success: true, cartOrders: orders });
  } catch (error) {
    console.error("Cart orders getirme hatası:", error);
    res.status(500).json({ message: "Cart orders getirilemedi", error });
  }
});

/* ======================
   Chat Model & Endpoints
   ====================== */

  // Örnek şema (Tech.js veya server.js içinde)
  const techSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true },
    username: { type: String, required: true, default: 'Unknown' },
    message: { type: String, required: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    language: { type: String, default: 'unknown' },
    timestamp: { type: Date, default: Date.now },
    
    // Yeni status alanı: waiting, active veya completed
    status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  });
  
  const Tech = mongoose.model('Tech', techSchema, 'Tech');
  
  // Tüm oda numaralarına göre gruplandırılmış sohbet kayıtlarını döndüren endpoint
  app.get('/getChatLogse', async (req, res) => {
    try {
      const groupedTech = await Tech.aggregate([
        {
          $group: {
            _id: "$roomNumber",
            messages: { $push: "$$ROOT" },
          },
        },
      ]);
      res.status(200).json(groupedTech);
    } catch (err) {
      console.error('Sohbet kayıtları alınırken hata:', err.message);
      res.status(500).json({ success: false, message: 'Sohbet kayıtları alınırken hata oluştu.' });
    }
  });
  
  // Belirli bir oda numarasına ait sohbet kayıtlarını döndüren endpoint
  app.get('/getChatLogsByRoome/:roomNumber', async (req, res) => {
    try {
      const roomNumber = req.params.roomNumber;
      if (!roomNumber) {
        return res.status(400).json({ success: false, message: 'Oda numarası gerekli.' });
      }
      const techLogs = await Tech.find({ roomNumber }).sort({ timestamp: 1 });
      if (techLogs.length === 0) {
        return res.status(404).json({ success: false, message: 'Bu odaya ait sohbet kaydı bulunamadı.' });
      }
      res.status(200).json(techLogs);
    } catch (err) {
      console.error(`Oda ${req.params.roomNumber} için sohbet alınırken hata:`, err.message);
      res.status(500).json({ success: false, message: 'Oda sohbeti alınırken hata oluştu.' });
    }
  });
  
  // Yeni bir sohbet mesajı kaydeden endpoint
  app.post('/saveResponsee', async (req, res) => {
    try {
      console.log('saveResponsee endpoint called with body:', JSON.stringify(req.body));
      
      const { roomNumber, username, message, sender, language } = req.body;
      if (!roomNumber || !username || !message || !sender) {
        console.log('Missing required fields:', { roomNumber, username, message, sender });
        return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik.' });
      }
      
      // Aynı oda için daha önce mesaj var mı kontrol ediyoruz.
      const existingMessage = await Tech.findOne({ roomNumber });
      if (!existingMessage) {
        // Bu oda için ilk mesaj, e-posta gönderimi yapılıyor.
        const mailOptions = {
          from: '"Tech Admin" <nihatsaydam13131@gmail.com>',
          to: 'nihat.saydam@icloud.com', // Bildirimi almak istenen e-posta adresi
          subject: `Yeni sohbet başlangıcı - Oda: ${roomNumber}`,
          text: `Yeni bir sohbet başladı.
  Oda: ${roomNumber}
  Kullanıcı: ${username}
  Mesaj: ${message}`
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('E-posta gönderim hatası:', error);
          } else {
            console.log('E-posta gönderildi:', info.response);
          }
        });
      }
      
      try {
        // Yeni mesaj kaydı eklenirken status otomatik olarak 'waiting' olacak
        const newTech = new Tech({ roomNumber, username, message, sender, language });
        console.log('Attempting to save new Tech document:', newTech);
        const savedTech = await newTech.save();
        console.log('Successfully saved Tech document:', savedTech);
        return res.status(200).json({ success: true, message: 'Mesaj kaydedildi!', data: savedTech });
      } catch (saveError) {
        console.error('MongoDB save error:', saveError);
        return res.status(500).json({ success: false, message: `MongoDB kayıt hatası: ${saveError.message}` });
      }
    } catch (err) {
      console.error('Mesaj kaydedilirken hata oluştu:', err);
      res.status(500).json({ success: false, message: 'Mesaj kaydedilirken hata oluştu.', error: err.message });
    }
  });
  
  // İsteği kabul eden endpoint: status 'active' olarak güncelleniyor
  app.put('/acceptRequest/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRequest = await Tech.findByIdAndUpdate(
        id,
        { status: 'active' },
        { new: true }
      );
      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }
      res.status(200).json({ success: true, message: 'Request activated!', data: updatedRequest });
    } catch (err) {
      console.error("Error updating request:", err.message);
      res.status(500).json({ success: false, message: 'Error updating request.' });
    }
  });
  // İsteği kabul eden endpoint: status 'active' olarak güncelleniyor
  app.put('/acceptRequest/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRequest = await Tech.findByIdAndUpdate(
        id,
        { status: 'active' },
        { new: true }
      );
      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }
      res.status(200).json({ success: true, message: 'Request activated!', data: updatedRequest });
    } catch (err) {
      console.error("Error updating request:", err.message);
      res.status(500).json({ success: false, message: 'Error updating request.' });
    }
  });
  
  // İsteği tamamlanan endpoint: status 'completed' olarak güncelleniyor
  app.put('/completeRequest/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRequest = await Tech.findByIdAndUpdate(
        id,
        { status: 'completed' },
        { new: true }
      );
      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }
      res.status(200).json({ success: true, message: 'Request completed!', data: updatedRequest });
    } catch (err) {
      console.error("Error updating request:", err.message);
      res.status(500).json({ success: false, message: 'Error updating request.' });
    }
  });
  
  // Opsiyonel: Durum güncellemek için dinamik endpoint
  app.put('/updateRequestStatus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['waiting', 'active', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }
      const updatedRequest = await Tech.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (!updatedRequest) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }
      res.status(200).json({ success: true, message: 'Status updated!', data: updatedRequest });
    } catch (err) {
      console.error("Error updating request:", err.message);
      res.status(500).json({ success: false, message: 'Error updating request.' });
    }
  });
  

// Mongoose Chat Şeması (Concierge Koleksiyonu)
const chatSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  message: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'active', 'resolved'], default: 'waiting' },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now }
  
});
const Chat = mongoose.model('Chat', chatSchema, 'Concierge');
// Talep durumunu güncelleme endpoint'i
app.put('/updateRequestStatus/:roomNumber', async (req, res) => {
  try {
    const { status } = req.body;
    const { roomNumber } = req.params;

    if (!['waiting', 'active', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    await Chat.updateMany({ roomNumber }, { status });

    res.status(200).json({ success: true, message: 'Status updated successfully.' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Error updating status.' });
  }
});

// GET /getChatLogs: Tüm oda numaralarına göre gruplandırılmış sohbet kayıtlarını döndürür
app.get('/getChatLogs', async (req, res) => {
  try {
    const groupedChats = await Chat.aggregate([
      {
        $group: {
          _id: "$roomNumber",
          messages: { $push: "$$ROOT" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json(groupedChats);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ success: false, message: 'Error fetching chat logs.' });
  }
});

// GET /getChatLogsByRoom/:roomNumber: Belirli bir oda numarasına ait sohbet kayıtlarını döndürür
app.get('/getChatLogsByRoom/:roomNumber', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'Room number is required.' });
    }
    const chats = await Chat.find({ roomNumber }).sort({ timestamp: 1 });
    if (chats.length === 0) {
      return res.status(404).json({ success: false, message: 'No chats found for this room.' });
    }
    res.status(200).json(chats);
  } catch (error) {
    console.error(`Error fetching chats for room ${req.params.roomNumber}:`, error);
    res.status(500).json({ success: false, message: 'Error fetching chats for the room.' });
  }
});


// POST /saveResponse: Yeni bir sohbet mesajı kaydeder ve ardından e-posta bildirimi gönderir
app.post('/saveResponse', async (req, res) => {
  try {
    const { roomNumber, username, message, sender } = req.body;
    if (!roomNumber || !username || !message || !sender) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    // Yeni sohbet kaydını oluştur ve kaydet
    const chat = new Chat({ roomNumber, username, message, sender });
    await chat.save();

    // E-posta bildirim içeriği
    const mailOptions = {
      from: '"Concierge Notification" <your.email@gmail.com>',
      to: 'nihat.saydam@icloud.com',  // Bildirimin gönderileceği e-posta adresi
      subject: `Yeni Mesaj - Oda ${roomNumber}`,
      text: `Yeni mesaj:
      
Oda: ${roomNumber}
Kullanıcı: ${username}
Gönderen: ${sender}
Mesaj: ${message}

Tarih: ${new Date().toLocaleString()}`
    };

    // E-posta gönderimini gerçekleştir
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(200).json({ success: true, message: 'Message saved and email sent!', chat });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, message: 'Error saving message.' });
  }
});

// Sunucuya bağlanma (örneğin, port 3000'de)


// Bellboy İstek Şeması
const bellboyRequestSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true },
  clickType: { type: String, required: true },
  details: { type: String },
  selectedTime: { type: Date },
  status: { type: String, default: 'waiting' }  // status eklendi
}, { timestamps: true }); // createdAt otomatik oluşur

const BellboyRequest = mongoose.model('BellboyRequest', bellboyRequestSchema, 'BellboyRequest');

// Bellboy İstek Kaydı ve Mail Bildirimi (POST)
app.post('/saveBellboyRequest', async (req, res) => {
  try {
    const { roomNumber, username, clickType, details, selectedTime } = req.body;

    if (!roomNumber || !clickType) {
      return res.status(400).json({ success: false, message: "Eksik alanlar var: roomNumber, clickType." });
    }

    const newRequest = new BellboyRequest({
      roomNumber,
      username,
      clickType,
      details,
      selectedTime: selectedTime ? new Date(selectedTime) : undefined,
      status: 'waiting'  // default status
    });
    await newRequest.save();

    const mailOptions = {
      from: '"Bellboy Notification" <nihatsaydam13131@gmail.com>',
      to: 'nihat.saydam@icloud.com',
      subject: 'Yeni Bellboy İsteği Geldi',
      text: `Yeni Bellboy isteği:
Oda: ${roomNumber}
Siparişi veren: ${username}
İstek Türü: ${clickType}
Detaylar: ${details || 'Yok'}
Seçilen Zaman: ${selectedTime ? new Date(selectedTime).toLocaleString() : 'Belirtilmemiş'}

Yönetim panelini kontrol edin.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('E-posta hatası:', error);
      else console.log('E-posta gönderildi:', info.response);
    });

    await newRequest.save();
    res.status(200).json({ success: true, message: "Bellboy isteği başarıyla oluşturuldu.", bellboyRequest: newRequest });

  } catch (err) {
    console.error("Kayıt hatası:", err);
    res.status(500).json({ success: false, message: "Server hatası oluştu." });
  }
});

// Bellboy İsteklerini Getir (Odaya Göre veya Hepsi)
app.get('/getBellboyRequests', async (req, res) => {
  try {
    const filter = req.query.roomNumber ? { roomNumber: req.query.roomNumber } : {};
    const requests = await BellboyRequest.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, bellboyRequests: requests });
  } catch (err) {
    console.error('Bellboy istekleri hata:', err.message);
    res.status(500).json({ success: false, message: "Bellboy istekleri alınamadı." });
  }
});

// Bellboy Status Güncelle
app.put('/updateBellboyStatus/:id', async (req, res) => {
  try {
    const updatedRequest = await BellboyRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, bellboyRequest: updatedRequest });
  } catch (error) {
    console.error("Status güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Status güncellenemedi." });
  }
});

// *****************
// Laundry Model & Endpoints
// *****************

// Laundry şeması: 'status' alanı eklenmiştir.
const laundrySchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  items: [{
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: Number, required: true },
  }],
  totalPrice: { type: Number, required: true },
  serviceTime: { type: Number, required: true },         // Örneğin, 30, 60, 120, 240
  serviceTimeLabel: { type: String, required: true },      // Örneğin, "In 30 minutes"
  status: { type: String, default: 'waiting' },            // Yeni alan
  createdAt: { type: Date, default: Date.now },
});

// Üçüncü parametre olarak 'Laundry' vererek koleksiyon ismini belirliyoruz.
const Laundry = mongoose.model('Laundry', laundrySchema, 'Laundry');



// Laundry verilerini kaydeden endpoint
app.post('/saveLaundry', async (req, res) => {
  try {
    const { roomNumber, username, items, totalPrice, serviceTime, serviceTimeLabel } = req.body;
    if (!roomNumber || !items || typeof totalPrice === 'undefined' || typeof serviceTime === 'undefined' || !serviceTimeLabel) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik: roomNumber, items, totalPrice, serviceTime veya serviceTimeLabel.'
      });
    }

    // username gönderilmemişse default değeri kullanıyoruz.
    const newLaundry = new Laundry({ roomNumber, username: username || "Bilinmiyor", items, totalPrice, serviceTime, serviceTimeLabel });
    await newLaundry.save();

    // E-posta gönderimi
    const mailOptions = {
      from: '"Laundry Uygulaması" <nihatssaydam13131@gmail.com>',
      to: 'nihat.saydam@icloud.com',  // Bildirim almak istediğiniz e-posta adresi
      subject: 'Yeni Laundry Siparişi Geldi',
      text: `Yeni bir laundry siparişi geldi. Oda: ${roomNumber}, Siparişi veren: ${newLaundry.username}. Detaylar için yönetim panelini kontrol edebilirsiniz.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('E-posta gönderim hatası:', error);
      } else {
        console.log('E-posta gönderildi:', info.response);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Laundry verileri başarıyla kaydedildi!',
      laundry: newLaundry
    });
  } catch (err) {
    console.error('Laundry verileri kaydedilirken hata oluştu:', err.message);
    res.status(500).json({ success: false, message: 'Laundry verileri kaydedilirken hata oluştu.' });
  }
});

// Belirli bir oda numarasına göre Laundry verilerini döndüren endpoint
app.get('/getLaundry/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'Oda numarası gereklidir.' });
    }
    const laundryData = await Laundry.find({ roomNumber }).sort({ createdAt: -1 });
    if (laundryData.length === 0) {
      return res.status(404).json({ success: false, message: 'Bu odaya ait laundry verisi bulunamadı.' });
    }
    res.status(200).json({ success: true, laundry: laundryData });
  } catch (err) {
    console.error('Laundry verileri alınırken hata oluştu:', err.message);
    res.status(500).json({ success: false, message: 'Laundry verileri alınırken hata oluştu.' });
  }
});
// Sunucu tarafında (server.js)
app.patch('/updateLaundry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) { // Kontroller eklendi
      return res.status(400).json({ success: false, message: 'Eksik ID veya durum.' });
    }
    const updatedLaundry = await Laundry.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedLaundry) { // Kayıt bulunamazsa kontrol eklendi
      return res.status(404).json({ success: false, message: 'Laundry kaydı bulunamadı.' });
    }
    res.status(200).json({ success: true, laundry: updatedLaundry });
  } catch (err) {
    console.error("Güncelleme hatası:", err.message);
    res.status(500).json({ success: false, message: 'Güncelleme hatası.' });
  }
});


// Laundry siparişlerini oda numarasına göre gruplandıran endpoint
app.get('/getLaundryAll', async (req, res) => {
  const statusFilter = req.query.status;
  let filter = {};
  if (statusFilter && statusFilter !== 'all') {
    filter = { status: statusFilter };
  }
  try {
    const groupedLaundry = await Laundry.aggregate([
      {
        $match: filter
      },
      {
        $sort: { createdAt: -1 } // Önce en yeni siparişler gelsin diye sıralama eklendi
      },
      {
        $group: {
          _id: "$roomNumber",
          orders: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          roomNumber: "$_id",
          orders: 1,
          _id: 0
        }
      },
       {
        $sort: { roomNumber: 1 } // Oda numarasına göre sırala (isteğe bağlı)
      }
    ]);
    res.status(200).json(groupedLaundry);
  } catch (err) {
    console.error("Laundry siparişleri gruplandırılırken hata oluştu:", err.message);
    res.status(500).json({ success: false, message: "Laundry siparişleri gruplandırılırken hata oluştu." });
  }
});


/// Şikayet Modeli
const ComplainSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: 'Unknown' },
  message: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  // Yeni eklenen status alanı
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  timestamp: { type: Date, default: Date.now },
});

const Complain = mongoose.model('Complain', ComplainSchema, 'Complain');

// Tüm oda numaralarına göre şikayetleri gruplandıran endpoint
app.get('/getComplain', async (req, res) => {
  try {
    const groupedComplain = await Complain.aggregate([
      {
        $group: {
          _id: "$roomNumber",
          messages: {
            $push: {
              _id: "$_id", // _id bilgisini de ekliyoruz
              message: "$message",
              sender: "$sender",
              status: "$status",
              timestamp: "$timestamp",
              username: "$username"
            }
          },
        },
      },
      {
        $project: {
          roomNumber: "$_id",
          messages: 1,
          _id: 0
        }
      }
    ]);
    
    
    res.status(200).json(groupedComplain);
  } catch (err) {
    console.error('Error fetching complain logs:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching complain logs.' });
  }
});

// Belirli bir oda numarasına ait şikayet kayıtlarını döndüren endpoint
app.get('/getChatLogsByco/:roomNumber', async (req, res) => {
  try {
    const roomNumber = req.params.roomNumber;
    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'Room number is required.' });
    }
    const complains = await Complain.find({ roomNumber }).sort({ timestamp: 1 });
    if (complains.length === 0) {
      return res.status(404).json({ success: false, message: 'No complains found for this room.' });
    }
    res.status(200).json(complains);
  } catch (err) {
    console.error(`Error fetching complains for room ${req.params.roomNumber}:`, err.message);
    res.status(500).json({ success: false, message: 'Error fetching complains for the room.' });
  }
});

// Yeni bir şikayet mesajı kaydeden ve ardından e-posta bildirimi gönderen endpoint
app.post('/saveComplain', async (req, res) => {
  try {
    const { roomNumber, username, message, sender } = req.body;
    if (!roomNumber || !username || !message || !sender) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    // "status" alanı modelde varsayılan olarak "waiting" olarak ayarlandığı için ayrıca eklemeye gerek yok.
    const newComplain = new Complain({ roomNumber, username, message, sender });
    await newComplain.save();

    // E-posta içeriği
    const mailOptions = {
      from: '"Complain Notification" <nihatsaydam13131@gmail.com>',
      to: 'nihat.saydam@icloud.com',
      subject: `Yeni Şikayet - Oda ${roomNumber}`,
      text: `Yeni şikayet geldi:
      
Oda: ${roomNumber}
Kullanıcı: ${username}
Mesaj: ${message}
Gönderen: ${sender}
Tarih: ${new Date().toLocaleString()}
Status: waiting
`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('E-posta gönderim hatası:', error);
      } else {
        console.log('E-posta gönderildi:', info.response);
      }
    });

    res.status(200).json({ success: true, message: 'Message saved and email sent!', complain: newComplain });
  } catch (err) {
    console.error('Error saving message:', err.message);
    res.status(500).json({ success: false, message: 'Error saving message.' });
  }
});

// Şikayet durumunu "waiting" -> "active" olarak güncelleyen endpoint
app.put('/updateStatusToActive/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const complain = await Complain.findById(id);
    if (!complain) {
      return res.status(404).json({ success: false, message: 'Complain not found.' });
    }
    if (complain.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Only complaints with status "waiting" can be updated to "active".' });
    }
    complain.status = 'active';
    await complain.save();
    res.status(200).json({ success: true, message: 'Status updated to active.', complain });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ success: false, message: 'Error updating status.' });
  }
});

// Şikayet durumunu "active" -> "completed" olarak güncelleyen endpoint
app.put('/updateStatusToCompleted/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const complain = await Complain.findById(id);
    if (!complain) {
      return res.status(404).json({ success: false, message: 'Complain not found.' });
    }
    if (complain.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only complaints with status "active" can be updated to "completed".' });
    }
    complain.status = 'completed';
    await complain.save();
    res.status(200).json({ success: true, message: 'Status updated to completed.', complain });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ success: false, message: 'Error updating status.' });
  }
});

// RoomService şeması
// RoomService şeması
const roomServiceSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  username: { type: String, required: true, default: "Unknown" },
  items: [{
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true },
  serviceTime: { type: Number, required: true },
  serviceTimeLabel: { type: String, required: true },
  
  // Yeni status alanı: waiting, active veya completed
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  
  createdAt: { type: Date, default: Date.now }
});

const RoomService = mongoose.model('RoomService', roomServiceSchema, 'RoomService');

// RoomService verilerini kaydeden endpoint
app.post('/saveRoomservice', async (req, res) => {
  try {
    const { roomNumber, username, items, totalPrice, serviceTime, serviceTimeLabel } = req.body;
    
    // Gerekli alanların kontrolü
    if (!roomNumber || !items || typeof totalPrice === 'undefined' || typeof serviceTime === 'undefined' || !serviceTimeLabel) {
      return res.status(400).json({
        success: false,
        message: "Gerekli alanlar eksik: roomNumber, items, totalPrice, serviceTime veya serviceTimeLabel."
      });
    }
    
    const newRoomService = new RoomService({ roomNumber, username, items, totalPrice, serviceTime, serviceTimeLabel });
    await newRoomService.save();
    const itemsString = items.map(item => `${item.name} (Miktar: ${item.quantity}, Fiyat: ${item.price})`).join(', ');

    // E-posta gönderimi için mailOptions tanımlıyoruz.
    const mailOptions = {
      from: '"Room Service Uygulaması" <nihatsaydam13131@gmail.com>',
      to: ['nihat.saydam@icloud.com'],
      // Bildirimi almak istediğiniz e-posta adresi
      subject: 'Yeni Room Service Siparişi Geldi',
      text: `Yeni bir room service siparişi geldi.
Oda: ${roomNumber}
Siparişi veren: ${username || 'Bilinmiyor'}
Ürünler: ${itemsString}
Toplam Fiyat: ${totalPrice}₺
Hizmet Süresi: ${serviceTimeLabel} (${serviceTime})
Detaylar için yönetim panelini kontrol edebilirsiniz.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('E-posta gönderim hatası:', error);
      } else {
        console.log('E-posta gönderildi:', info.response);
      }
    });
    
    res.status(200).json({
      success: true,
      message: "Room service başarıyla kaydedildi!",
      roomService: newRoomService
    });
  } catch (error) {
    console.error("Room service kaydedilirken hata oluştu:", error.message);
    res.status(500).json({
      success: false,
      message: "Room service kaydedilirken hata oluştu."
    });
  }
});

// Tüm RoomService kayıtlarını getiren endpoint
app.get('/getRoomservices', async (req, res) => {
  try {
    // Eğer istek query parametresi ile filtrelenecekse, örn: ?roomNumber=101
    const filter = {};
    if (req.query.roomNumber) {
      filter.roomNumber = req.query.roomNumber;
    }
    const roomServices = await RoomService.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, roomServices });
  } catch (error) {
    console.error("Room service kayıtları alınırken hata:", error.message);
    res.status(500).json({
      success: false,
      message: "Room service kayıtları alınırken hata oluştu."
    });
  }
});

// Durum güncelleme için endpoint
app.put('/updateRoomServiceStatus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['waiting', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const updatedOrder = await RoomService.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.status(200).json({ success: true, message: 'Status updated!', data: updatedOrder });
  } catch (err) {
    console.error("Error updating room service status:", err.message);
    res.status(500).json({ success: false, message: 'Error updating room service status.' });
  }
});

const askSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  status: { type: String, enum: ['waiting', 'Active', 'complate'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now }
});

const Ask = mongoose.model('Ask', askSchema, 'Ask');
app.post('/ask1', async (req, res) => {
  try {
    const { roomNumber, message, sender, status } = req.body;
    const validStatuses = ['waiting', 'Active', 'complate'];
    const msgStatus = (status && validStatuses.includes(status)) ? status : 'waiting';

    const newMessage = new Ask({ roomNumber, message, sender, status: msgStatus });
    const savedMessage = await newMessage.save();
    res.status(201).json({ success: true, data: savedMessage });
  } catch (error) {
    console.error('Mesaj kaydedilirken hata oluştu:', error);
    res.status(500).json({ success: false, error: 'Mesaj kaydedilirken hata oluştu.' });
  }
});
app.get('/ask2/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const messages = await Ask.find({ roomNumber }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error(`Mesajlar çekilirken hata oluştu (Oda ${req.params.roomNumber}):`, error);
    res.status(500).json({ success: false, error: 'Mesajlar çekilirken hata oluştu.' });
  }
});
// GET /getAskRequests endpoint'i
app.get('/getAskRequests', async (req, res) => {
  try {
    // Veritabanından talepleri çek (örneğin, Ask modelin varsa)
    const requests = await Ask.find().sort({ createdAt: -1 }); // En son talepler önce gelsin
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Talepler çekilirken hata oluştu:', error);
    res.status(500).json({ success: false, error: 'Bir hata oluştu' });
  }
});
// Sunucu tarafında status güncelleme endpoint'i (server.js içinde)
app.put('/updateAskStatus/:id/:newStatus', async (req, res) => {
  const { id, newStatus } = req.params;
  const validStatuses = ['waiting', 'Active', 'complate'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ success: false, error: 'Geçersiz durum' });
  }
  try {
    const updated = await Ask.findByIdAndUpdate(id, { status: newStatus }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Kayıt bulunamadı' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Status güncellenirken hata:', err);
    res.status(500).json({ success: false, error: 'Güncelleme hatası' });
  }
});

// Sepet (Cart) için bir Mongoose şeması tanımlıyoruz






// Cart (Sepet) modeli şeması
const cartSchema = new mongoose.Schema({
    items: [{
        productName: String,
        quantity: Number,
        price: Number
    }],                         // Sepetteki ürünler listesi (ürün adı, adet, fiyat vb.)
    totalPrice: { type: Number, default: 0 },      // Sepetin toplam tutarı
    createdAt: { type: Date, default: Date.now }   // Oluşturulma tarihi
});
const Cart = mongoose.model('Cart', cartSchema);

// HousekeepingRequest (Oda hizmeti talebi) modeli şeması
const housekeepingRequestSchema = new mongoose.Schema({
    roomNumber: { type: Number, required: true },    // Oda numarası
    requestType: { type: String, required: true },   // Talep türü (ör. "Temizlik", "Havlu", vb.)
    description: { type: String },                   // Talep ile ilgili açıklama
    status: { type: String, default: 'pending' },    // Durum ("pending", "completed" gibi)
    requestedAt: { type: Date, default: Date.now }   // Talep oluşturulma zamanı
});
const HousekeepingRequest = mongoose.model('HousekeepingRequest', housekeepingRequestSchema);




// Tüm sepetleri getir (GET /carts)
app.get('/carts', async (req, res) => {
    try {
        const carts = await Cart.find();
        res.json(carts);
    } catch (error) {
        console.error('Error fetching carts:', error);
        res.status(500).json({ error: 'Sepetler alınamadı' });
    }
});

// Yeni bir sepet oluştur (POST /carts)
app.post('/carts', async (req, res) => {
    try {
        const cartData = req.body;              // İstek gövdesindeki sepet verisi
        const newCart = new Cart(cartData);
        const savedCart = await newCart.save(); // Veritabanına kaydet
        res.status(201).json(savedCart);
    } catch (error) {
        console.error('Error creating cart:', error);
        res.status(500).json({ error: 'Yeni sepet oluşturulamadı' });
    }
});

// Tüm housekeeping taleplerini getir (GET /housekeeping-requests)
app.get('/housekeeping-requests', async (req, res) => {
    try {
        const requests = await HousekeepingRequest.find();
        res.json(requests);
    } catch (error) {
        console.error('Error fetching housekeeping requests:', error);
        res.status(500).json({ error: 'Housekeeping istekleri alınamadı' });
    }
});

// Yeni bir housekeeping talebi oluştur (POST /housekeeping-requests)
app.post('/housekeeping-requests', async (req, res) => {
    try {
        const requestData = req.body;                // İstek gövdesindeki talep verisi
        const newRequest = new HousekeepingRequest(requestData);
        const savedRequest = await newRequest.save(); // Veritabanına kaydet
        res.status(201).json(savedRequest);
    } catch (error) {
        console.error('Error creating housekeeping request:', error);
        res.status(500).json({ error: 'Housekeeping isteği oluşturulamadı' });
    }
});

// Ana sayfa endpoint'i (Opsiyonel)
app.get('/', (req, res) => {
  res.send('Welcome to Keepsty Backend API!');
});
// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
   