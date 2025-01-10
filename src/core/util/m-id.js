import { UUID } from "./uuid.js";

export const mId_generate = () => {
	const time = new Date().getTime().toString();
	return `${ UUID.generate().substring( 0, 12 ) }-${ time.substring( 4, time.length ) }`;
}