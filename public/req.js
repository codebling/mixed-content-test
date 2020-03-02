const axios = require('axios');

const domain = document.domain;

axios.get(`http://${domain}/xhr.svg`);