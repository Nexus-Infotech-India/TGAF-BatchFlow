/// <reference types="node" />

declare module 'node-wkhtmltopdf' {
    const wkhtmltopdf: (
        input: string,
        options?: Record<string, any>
    ) => NodeJS.ReadableStream;
    export default wkhtmltopdf;
}