export const outError = ( ...e ) => {
	return new Error( e ).stack
}