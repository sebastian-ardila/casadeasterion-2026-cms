import { d as defineMiddleware, s as sequence } from './chunks/index_DF-AM1Hh.mjs';
import { l as loadCurrentUser } from './chunks/auth_DWIRVYmF.mjs';
import 'es-module-lexer';
import './chunks/astro-designed-error-pages_CnR_Kh1C.mjs';
import './chunks/astro/server_Cc6zjcpi.mjs';

const onRequest$1 = defineMiddleware(async (context, next) => {
  context.locals.user = await loadCurrentUser(context);
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
