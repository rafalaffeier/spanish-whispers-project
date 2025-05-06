
# Aplium - Control de Jornada

## Descripción
Sistema de control de jornada para empleados desarrollado con React, TypeScript y Vite.

## Requisitos para la instalación
- Node.js 16 o superior
- PHP 7.4 o superior
- MySQL 5.7 o superior

## Configuración de despliegue en producción

### 1. Configuración del servidor web

Este proyecto está configurado para ejecutarse en la ruta `/apphora/`. Asegúrate de que:

- El directorio raíz de la aplicación esté configurado correctamente en tu servidor
- La base URL en `vite.config.ts` está configurada como `/apphora/`
- El archivo `index.html` contiene un tag `<base href="/apphora/" />`

### 2. Configuración de la API PHP

La API PHP debe estar ubicada en la carpeta `/api` dentro del directorio de despliegue.

### 3. Redirecciones para SPA

Para que la aplicación de una sola página (SPA) funcione correctamente, necesitas configurar redirecciones:

#### Para Apache (archivo .htaccess en la carpeta raíz del proyecto)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /apphora/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /apphora/index.html [L]
</IfModule>
```

#### Para Nginx

```nginx
location /apphora/ {
  try_files $uri $uri/ /apphora/index.html;
}
```

### 4. Despliegue con Plesk y GitHub

1. Configura un webhook en GitHub para tu repositorio
2. En Plesk, configura la integración con GitHub:
   - Apunta al directorio `/httpdocs/apphora`
   - Configura la rama que quieres desplegar (main/master)
   - Asegúrate de que los permisos sean correctos después del despliegue (flcdmpe/adfrw)

3. Después de cada push a GitHub, el webhook enviará una notificación a Plesk para actualizar los archivos.

## Solución de problemas comunes

- **Rutas 404**: Verifica que la configuración de redirecciones esté correctamente implementada
- **API no disponible**: Comprueba los permisos de la carpeta `/api` y sus archivos
- **Error en la carga de assets**: Asegúrate de que todas las URL usan la base correcta (`/apphora/`)
