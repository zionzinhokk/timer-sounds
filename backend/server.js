const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: "*"
}));
app.use(express.json());

const uploadPath = path.join(__dirname, "uploads");

// garante que a pasta existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// configuração do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { files: 20 },
});

// rota upload
app.post("/upload", upload.array("sounds", 20), (req, res) => {
  res.json({ message: "Arquivos enviados com sucesso!" });
});

// lista sons
app.get("/sounds", (req, res) => {
  const files = fs.readdirSync(uploadPath);
  res.json(files);
});

// pega som aleatório
app.get("/random", (req, res) => {
  const files = fs.readdirSync(uploadPath);

  if (files.length === 0) {
    return res.status(404).json({ message: "Nenhum som disponível" });
  }

  const randomFile = files[Math.floor(Math.random() * files.length)];
  res.json({ file: randomFile });
});

// servir arquivos estáticos
app.use("/uploads", express.static(uploadPath));

// deletar som
app.delete("/delete/:name", (req, res) => {
  const fileName = decodeURIComponent(req.params.name);
  const filePath = path.join(uploadPath, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Arquivo não encontrado" });
  }

  try {
    fs.unlinkSync(filePath);
    return res.json({ message: "Arquivo deletado com sucesso" });
  } catch (err) {
    return res.status(500).json({ message: "Erro ao deletar arquivo" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});