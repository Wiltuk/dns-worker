import { Router } from 'itty-router'
import xss from 'xss'
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

    let cleanParam = xss(decodeURIComponent(params.text), {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
    })

    async function dnsReqs() {
        const init = {
            headers: {
                accept: 'application/dns-json',
            },
        }
        const dnsTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
        let dnsResults = {}

        for (let i = 0; i < dnsTypes.length; i++) {
            let url = cfDns + cleanParam + '&type=' + dnsTypes[i]
            const response = await fetch(url, init)
            dnsResults[dnsTypes[i]] = await gatherResponse(response)
        }
        return dnsResults
    }

    async function parseDnsResp() {
        let dnsRes = await dnsReqs()

        let aRes = JSON.stringify(dnsRes['A']['Answer'])
        let aaaaRes = JSON.stringify(dnsRes['AAAA']['Answer'])
        let cnameRes = JSON.stringify(dnsRes['CNAME']['Answer'])
        let mxRes = JSON.stringify(dnsRes['MX']['Answer'])
        let txtRes = JSON.stringify(dnsRes['TXT']['Answer'])
        let nsRes = JSON.stringify(dnsRes['NS']['Answer'])
        let soaRes = JSON.stringify(dnsRes['SOA']['Answer'])

        function aHtml() {
            if (aRes != null && dnsRes['A']['Answer'][0]['type'] == 1) {
                return `<tr><td>A</td><td>${aRes}</td></tr>`
            } else {
                return ` `
            }
        }

        function aaaaHtml() {
            if (aaaaRes != null && dnsRes['AAAA']['Answer'][0]['type'] == 28) {
                return `<tr><td>AAAA</td><td>${aaaaRes}</td></tr>`
            } else {
                return ` `
            }
        }

        function cnameHtml() {
            if (cnameRes != null && dnsRes['CNAME']['Answer'][0]['type'] == 5) {
                return `<tr><td>CNAME</td><td>${cnameRes}</td></tr>`
            } else {
                return ` `
            }
        }

        function mxHtml() {
            if (mxRes != null && dnsRes['MX']['Answer'][0]['type'] == 15) {
                return `<tr><td>MX</td><td>${mxRes}</td></tr>`
            } else {
                return ` `
            }
        }

        function txtHtml() {
            if (txtRes != null && dnsRes['TXT']['Answer'][0]['type'] == 16) {
                return `<tr><td>TXT</td><td>${txtRes}</td></tr>`
            } else {
                return ` `
            }
        }

        function nsHtml() {
            if (nsRes != null && dnsRes['NS']['Answer'][0]['type'] == 2) {
                return `<tr><td>NS</td><td>${nsRes}</td></tr>`
            } else {
                return ` `
            }
        }

        function soaHtml() {
            if (soaRes != null && dnsRes['SOA']['Answer'][0]['type'] == 6) {
                return `<tr><td>SOA</td><td>${soaRes}</td></tr>`
            } else {
                return ` `
            }
        }

        const htmlPage =
            `<!DOCTYPE html>
<body>

  <h1>DNS Records for ${cleanParam}</h1>

<table>
<thead><tr><th>Record Type</th><th>Record Value</th></tr></thead>
<tbody>` +
            aHtml() +
            aaaaHtml() +
            cnameHtml() +
            mxHtml() +
            txtHtml() +
            nsHtml() +
            soaHtml() +
            `</tbody>
  </table>
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
