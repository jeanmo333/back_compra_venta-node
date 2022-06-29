import models from "../models";
import bcrypt from "bcryptjs";
import tokenService from "../services/token";

const errorReq = (res, error, next) => {
  res.status(500).send({
    message: `Ocurrió un error: ${error}`,
  });
  next(error);
};

const add = async (req, res, next) => {
  try {
    req.body.password = await bcrypt.hash(req.body.password, 10);
    if (!req.body.rol) {
      res.status(404).json({ msg: "rol no encontrado" });
    }
    const registro = await models.Usuario.create(req.body);

    res.status(200).json(registro);
  } catch (error) {
    errorReq(res, error, next);
  }
};

const query = async (req, res, next) => {
  try {
    const consultaRegistro = await models.Usuario.findOne({
      _id: req.query._id,
    });

    if (!consultaRegistro) {
      res.status(404).send({
        message: "No existe el registro",
      });
    } else {
      res.status(200).json(consultaRegistro);
    }
  } catch (error) {
    errorReq(res, error, next);
  }
};

const list = async (req, res, next) => {
  try {
    const valor = req.query.valor;

    const lista = await models.Usuario.find(
      {
        $or: [
          { nombre: new RegExp(valor, "i") },
          { email: new RegExp(valor, "i") },
        ],
      },
      { createdAt: 0 }
    ).sort({ createdAt: -1 });

    res.status(200).json(lista);
  } catch (error) {
    errorReq(res, error, next);
  }
};

const update = async (req, res, next) => {
  try {
    const usuario = await models.Usuario.findOne({ _id: req.query._id });

    if (req.body.password !== usuario.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const registro = await models.Usuario.findByIdAndUpdate(
      { _id: req.body._id },
      {
        rol: req.body.rol,
        nombre: req.body.nombre,
        tipo_documento: req.body.tipo_documento,
        num_documento: req.body.num_documento,
        direccion: req.body.direccion,
        telefono: req.body.telefono,
        email: req.body.email,
        password: req.body.password,
      }
    );

    res.status(200).json(registro);
  } catch (error) {
    errorReq(res, error, next);
  }
};

const remove = async (req, res, next) => {
  try {
    const registro = await models.Usuario.findByIdAndDelete({
      _id: req.body._id,
    });

    res.status(200).json(registro);
  } catch (error) {
    errorReq(res, error, next);
  }
};

const activate = async (req, res, next) => {
  try {
    const activar = await models.Usuario.findByIdAndUpdate(
      { _id: req.body._id },
      { estado: 1 }
    );

    res.status(200).json(activar);
  } catch (error) {
    errorReq(res, error, next);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const desactivar = await models.Usuario.findByIdAndUpdate(
      { _id: req.body._id },
      { estado: 0 }
    );

    res.status(200).json(desactivar);
  } catch (error) {
    errorReq(res, error, next);
  }
};

const validarPassword = async (passwordInput, passwordUsuario, res) => {
  const matchPassword = await bcrypt.compare(passwordInput, passwordUsuario);
  if (matchPassword) {
    return true;
  } else {
    res.status(404).send({
      message: "Password Incorrecto",
    });
    return false;
  }
};

const verificarUsuario = async (email, passwordInput, res) => {
  const usuario = await models.Usuario.findOne({ email, estado: 1 });

  if (usuario) {
    return await validarPassword(passwordInput, usuario.password, res);
  } else {
    res.status(404).send({
      message: "No existe el usuario",
    });
    return false;
  }
};

const login = async (req, res, next) => {
  try {
    if (await verificarUsuario(req.body.email, req.body.password, res)) {
      const usuario = await models.Usuario.findOne({ email: req.body.email });
      const token = await tokenService.generarToken(usuario._id);
      res.status(200).json({ usuario, token });
    }
  } catch (error) {
    errorReq(res, error, next);
  }
};

export default {
  add,
  query,
  list,
  update,
  remove,
  activate,
  deactivate,
  login,
};
