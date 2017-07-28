module.exports = function(RED) {

  function NeviwebAccountNode(config) {
    RED.nodes.createNode(this, config);
    this.log(config);
    var node = this;
    var url = config.url;
    var email = this.credentials.email;
    var password = this.credentials.password;
    var request = require("request");
    var sessionId = "";
    
    this.doRequest = function(options, callback) {
      if ( sessionId === "" ) {
        node.doLogin();      
      }
      options["Session-Id"] = sessionId;
      this.log("DoRequest " + options);
      request(options, callback);
    }
    
    this.doLogin = function() {
      var options = {
        rejectUnauthorized: false,
        uri: decodeURIComponent(url + 'login'),
        body: {
          email: email,
          password: password
        },
        method: 'POST',
        followAllRedirects: true,
        json: true
      };
      request(options, function(errors, response, body) {
        if (errors) {
              
        } else if ( body.session !== "" ) {
          node.sessionId = body.session;
          this.log("Login success : " + body.session);
        } else {
          node.log("Login error : " + body);
        }
      });
    }
    
    this.gateway = function(callback) {
      var options = {
        rejectUnauthorized: false,
        uri: decodeURIComponent(url + 'gateway'),
        method: "GET"
      };
      node.doRequest(options, callback);
  }
  
  function NeviwebGatewayNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var account = RED.nodes.getNode(config.account);
    
    this.on('input', function(msg) {
      this.log("Asking gateway " + msg.payload);
      account.gateway( function(errors, response, body) {
        msg.payload = body;
        node.send(msg);
      });
    });
  }
            
            
  RED.nodes.registerType("neviweb-account", NeviwebAccountNode, {
    credentials: {
      email: {
        type: "text"
      },
      password: {
        type: "password"
      }
    }
  });
  
  RED.nodes.registerType("neviweb-gateway", NeviwebGatewayNode);
}