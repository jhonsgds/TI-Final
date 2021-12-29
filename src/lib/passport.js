const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');

const helpers = require('../lib/helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true    
},  async (req, username, password, done) => {
    pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if (validPassword) {
            done(null, user, req.flash("success", "Bienvenido " + user.username));
        } else {
            done(null, false, req.flash("message", "Contraseña Incorrecta"));
        }
    } else {
        return done(null, false, req.flash("message", "El usuario no existe"));
    }
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    const { name } = req.body;
    const { lastname } = req.body;
    const { email } = req.body;
    const newUser = {
        name,
        lastname,
        email,
        username,
        password
    };

    try {
        newUser.password = await helpers.encryptPassword(password);
        
        const result = await pool.query('INSERT INTO users SET ?', [newUser]);
        
        newUser.id = result.insertId;
        
        return done(null, newUser);
    
    } catch (err) {

        if (err.code === 'ER_DUP_ENTRY') {

           return done(null, false, req.flash('message', 'El nombre de usuario que seleccionó ya está en uso, elija un nombre de usuario diferente.'));
        }
    }
}));

passport.serializeUser( (user, done) => {
    done(null, user.id);
});

passport.deserializeUser( async (id, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
});