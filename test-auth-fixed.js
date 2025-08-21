// Script para probar el login y registro - CORREGIDO

async function testLogin() {
  console.log('Probando login con cuenta demo...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'owner@luxurycuts.com',
        password: 'password123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ LOGIN EXITOSO!');
      console.log('Usuario:', data.user);
      return true;
    } else {
      console.log('❌ Login falló:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error en la petición:', error);
    return false;
  }
}

async function testRegister() {
  console.log('\nProbando registro de nuevo usuario...');
  
  const timestamp = Date.now();
  const newUser = {
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123',
    name: 'Test User',
    businessName: 'Test Business',
    subdomain: `test${timestamp}`
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ REGISTRO EXITOSO!');
      console.log('Nuevo usuario:', data.user);
      
      // Probar login con el nuevo usuario
      console.log('\nProbando login con el nuevo usuario...');
      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password
        })
      });
      
      const loginData = await loginResponse.json();
      if (loginResponse.ok) {
        console.log('✅ LOGIN CON NUEVO USUARIO EXITOSO!');
        return true;
      } else {
        console.log('❌ Login con nuevo usuario falló:', loginData.error);
        return false;
      }
    } else {
      console.log('❌ Registro falló:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error en la petición:', error);
    return false;
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('=================================');
  console.log('PRUEBA DE AUTENTICACIÓN');
  console.log('=================================\n');
  
  const loginOk = await testLogin();
  const registerOk = await testRegister();
  
  console.log('\n=================================');
  console.log('RESULTADO FINAL:');
  if (loginOk && registerOk) {
    console.log('✅ ¡TODO FUNCIONA CORRECTAMENTE!');
  } else {
    console.log('❌ Hay problemas con la autenticación');
  }
  console.log('=================================');
}

runTests();