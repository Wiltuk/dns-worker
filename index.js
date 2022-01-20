import { Router } from 'itty-router'
/**
 * Example someHost is set up to take in a JSON request
 * Replace url with the host you wish to send requests to
 * @param {string} someHost the host to send the request to
 * @param {string} url the URL to send the request to
 */
const cfDns = 'https://1.1.1.1/dns-query?name='
const router = Router()

//Root
router.get('/', () => {
    return new Response('Enter domain to lookup')
})

router.get('/:text', async ({ params }) => {
    /**
     * gatherResponse awaits and returns a response body as a string.
     * Use await gatherResponse(..) in an async function to get the response body
     * @param {Response} response
     */
    async function gatherResponse(response) {
        const { headers } = response
        const contentType = headers.get('content-type') || ''
        if (contentType.includes('application/dns-json')) {
            return await response.json()
        } else if (contentType.includes('application/text')) {
            return response.text()
        } else if (contentType.includes('text/html')) {
            return response.text()
        } else {
            return response.text()
        }
    }

    async function dnsReqs() {
        const init = {
            headers: {
                accept: 'application/dns-json',
            },
        }
        const dnsTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
        let dnsResults = {}

        for (let i = 0; i < dnsTypes.length; i++) {
            let url =
                cfDns + decodeURIComponent(params.text) + '&type=' + dnsTypes[i]
            const response = await fetch(url, init)
            dnsResults[dnsTypes[i]] = await gatherResponse(response)
        }
        return dnsResults
    }

    async function parseDnsResp() {
        let dnsRes = await dnsReqs()

        let aRes = JSON.stringify(dnsRes['A']['Answer'])
        let aaaaRes = JSON.stringify(dnsRes['AAAA']['Answer'])
        let mxRes = JSON.stringify(dnsRes['MX']['Answer'])
        let txtRes = JSON.stringify(dnsRes['TXT']['Answer'])
        let nsRes = JSON.stringify(dnsRes['NS']['Answer'])
        let soaRes = JSON.stringify(dnsRes['SOA']['Answer'])

        const htmlPage = `<!DOCTYPE html>
<body>
  <h1>DNS Records for ${decodeURIComponent(params.text)}</h1>
  <p>A Records: ${aRes}</p>
  <p>AAAA Records: ${aaaaRes}</p>
  <p>MX Records: ${mxRes}</p>
  <p>TXT Records: ${txtRes}</p>
  <p>NS Records: ${nsRes}</p>
  <p>SOA Records: ${soaRes}</p>
</body>`

        return new Response(htmlPage, {
            headers: {
                'content-type': 'text/html;charset=UTF-8',
            },
        })
    }

    return await parseDnsResp()
})

router.all('*', () => new Response('404, not found!', { status: 404 }))

addEventListener('fetch', e => {
    e.respondWith(router.handle(e.request))
})
