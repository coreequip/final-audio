(function() {
    const $ = document.querySelector.bind(document)
    const $$ = document.querySelectorAll.bind(document)

    const renderWaveform = (svg, preview) => {
        const svgRect = svg.getBoundingClientRect()
        const width = Math.floor(svgRect.width)
        const height = svgRect.height
        const step = preview.length * 3 / width
        const heightScale = svgRect.height / 256
        console.log(heightScale, step)
        svg.innerHTML = ''
        let lastX = -1
        for (const [idx, value] of preview.entries()) {
            const x = Math.floor(idx / step)
            if (x === lastX) continue
            lastX = x
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rect.setAttribute('x', x * 3)
            rect.setAttribute('y', height / 2 - value * heightScale / 2)
            rect.setAttribute('width', 2)
            rect.setAttribute('height', Math.max(value * heightScale, 1))
            rect.setAttribute('fill', '#1D85BF')
            svg.appendChild(rect)
        }
    }
    
    let lastTimeout = 0
    window.addEventListener('resize', () => {
        clearTimeout(lastTimeout)
        lastTimeout = setTimeout(() => {
            $$('section[data-sample]').forEach(section => {
                renderWaveform(section.querySelector('svg'), getPreview(section))
            })
        }, 500)
    })

    const getPreview = section => Uint8Array.from(
        atob(section.dataset.bits ?? '')
            .split('')
            .map(c => c.charCodeAt(0))
    )

    $$('section[data-sample]').forEach((section, idx, sectionMap) => {
        const sampleName = section.dataset.sample ?? '!EmptySampleName!'
        const duration = section.dataset.length ?? 0
        const title = section.dataset.title ?? sampleName
        const preview = getPreview(section)
        const description = section.textContent.trim()
        const last = idx + 1 === sectionMap.length

        console.log(last, sampleName, duration, preview.length, description)

        section.className = 'player'
        section.innerHTML = `
            <div class="poster"><img src="" alt="" /></div>
            <div>
                <h3></h3>
                <p></p>
                <div class="controls">
                    <div class="buttons">
                        <button class="paused">Before</button>
                        <button class="pause">After</button>
                    </div>
                    <div class="waveform"><svg></svg></div>
                </div>
            </div>
        `
        const img = section.querySelector('img')
        img.src = `audio/${sampleName}.webp`
        img.alt = `"${title}" poster`
        section.querySelector('h3').textContent = title
        section.querySelector('p').textContent = description
        const svg = section.querySelector('svg')
        const svgRect = svg.getBoundingClientRect()
        console.log(svgRect.width, svgRect.height)
        renderWaveform(svg, preview)
    })
})()