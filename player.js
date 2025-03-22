(function () {
    const $ = document.querySelector.bind(document)
    const $$ = document.querySelectorAll.bind(document)

    const renderWaveform = (svg, preview, suffix) => {
        const svgRect = svg.getBoundingClientRect()
        const width = Math.floor(svgRect.width)
        const height = svgRect.height
        const step = preview.length * 3 / width
        const heightScale = svgRect.height / 256
        svg.id = `waveform-${suffix}`
        svg.viewBox.baseVal.width = width
        svg.viewBox.baseVal.height = height
        svg.innerHTML = `
            <defs>
                <symbol id="waveform-symbol-${suffix}" preserveAspectRatio="none"></symbol>
                <clipPath id="played-clip-${suffix}">
                    <rect x="0" y="0" width="100%" height="100%"/>
                </clipPath>
                <clipPath id="unplayed-clip-${suffix}">
                    <rect x="0" y="0" width="100%" height="100%"/>
                </clipPath>
            </defs>
            <g class="waveform-group">
                <use href="#waveform-symbol-${suffix}" clip-path="url(#played-clip-${suffix})" class="waveform-played"/>
                <use href="#waveform-symbol-${suffix}" clip-path="url(#unplayed-clip-${suffix})" class="waveform-unplayed"/>
            </g>
            <g id="playhead-${suffix}" transform="translate(-1,0)">
                <line x1="0" y1="0"
                      x2="0" y2="100%"
                      stroke="white"
                      stroke-width="1"/>
            </g>
        `
        const $container = svg.querySelector('symbol')
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
            $container.appendChild(rect)
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

    const audio = new Audio()
    const updateWaveform = () => {
        const suffix = (audio.dataset.buttonId ?? '').split('-')[0]
        const svgContainer = $(`#waveform-${suffix}`)
        const svgWidth = svgContainer?.viewBox.baseVal.width;
        let progress = 1.1
        if (audio.paused) {
            setTimeout(updateWaveform, 500)
            if (!audio.dataset.buttonId) return
        } else {
            progress = audio.currentTime / audio.duration;
            setTimeout(updateWaveform, 16)
            if (isNaN(progress)) return
        }
        const splitPoint = svgWidth * progress;
        $(`#played-clip-${suffix} rect`)?.setAttribute('width', splitPoint)
        $(`#unplayed-clip-${suffix} rect`)?.setAttribute('x', splitPoint)
        $(`#playhead-${suffix}`)?.setAttribute('transform', `translate(${splitPoint},0)`)
        $(`#waveform-wrapper-${suffix}`).dataset.time = (!audio.paused ? `${formatTime(Math.ceil(audio.currentTime))} / ` : '')
            + `${formatTime(Math.ceil(audio.duration))}`
    }
    setTimeout(updateWaveform, 500)

    const formatTime = (time) => `${time / 60 | 0}:${('0' + time % 60).slice(-2)}`

    $$('section[data-sample]').forEach((section, idx, sectionMap) => {
        const sampleName = section.dataset.sample ?? '!EmptySampleName!'
        const duration = section.dataset.length ?? 0
        const title = section.dataset.title ?? sampleName
        const preview = getPreview(section)
        const description = section.textContent.trim()
        const last = idx + 1 === sectionMap.length

        section.className = 'player'
        section.innerHTML = `
            <div class="poster"><img src="" alt="" /></div>
            <div>
                <h3></h3>
                <p></p>
                <div class="controls">
                    <div class="buttons">
                        <button class="before paused">Before</button>
                        <button class="after paused">After</button>
                    </div>
                    <div class="waveform" id="waveform-wrapper-${sampleName}"><svg></svg></div>
                </div>
            </div>
        `
        const img = section.querySelector('img')
        img.src = `audio/${sampleName}.webp`
        img.alt = `"${title}" poster`
        section.querySelector('h3').textContent = title
        section.querySelector('p').textContent = description
        section.querySelector('.waveform').dataset.time = formatTime(duration)

        const svg = section.querySelector('svg')
        renderWaveform(svg, preview, sampleName)


        svg.addEventListener('click', (e) => {
            e.preventDefault()
            if (audio.paused) return
            const rect = svg.getBoundingClientRect()
            const clickPosition = (e.clientX - rect.left) / rect.width
            audio.currentTime = audio.duration * clickPosition;
        })

        const buttons = section.querySelectorAll('.buttons button')
        buttons.forEach(button => {
            const suffix = button.classList.contains('before') ? 'before' : 'after'
            button.id = `${sampleName}-${suffix}`
            button.addEventListener('click', () => {
                const audioSrc = `audio/${sampleName}-${suffix}.m4a`
                const playingButtonId = audio.dataset.buttonId ?? ''

                if (!audio.paused) {
                    audio.pause()
                    if (playingButtonId === button.id) {
                        return
                    }
                    pauseAudio()
                }
                audio.src = audioSrc
                audio.currentTime = parseFloat(button.dataset.position ?? 0)
                audio.dataset.buttonId = button.id
                audio.play()
            })
        })

    })

    audio.addEventListener('ended', (e) => {
        const $button = document.getElementById(audio.dataset.buttonId)
        console.log('ended', e, audio, $button, e.currentTarget.dataset)
        updateWaveform()
        delete $button.dataset.position
        delete audio.dataset.buttonId
    })
    audio.addEventListener('play', (evt) => {
        const $button = document.getElementById(audio.dataset.buttonId)
        $button.classList.add('playing')
        $button.classList.remove('paused')
    })
    const pauseAudio = () => {
        console.debug('pauseAudio', audio.dataset.buttonId)
        if (!audio.dataset.buttonId) return
        updateWaveform()
        const $button = document.getElementById(audio.dataset.buttonId)
        $button.classList.remove('playing')
        $button.classList.add('paused')
        $button.dataset.position = audio.currentTime.toFixed(2)
    }
    audio.addEventListener('pause', pauseAudio)


    $$('.reference-videos section[data-reference]').forEach(($section, idx, sectionMap) => {
        const refId = $section.dataset.reference ?? '!EmptyReferenceId!'
        const refTitle = $section.innerText.trim()
        $section.className = 'video-container group'
        $section.innerHTML = `
            <video class="video" poster="video/reference${refId}.webp">
                <source src="video/reference${refId}.mp4" type="video/mp4">
            </video>
            <div class="play-button"></div>
            <div class="title">${refTitle}</div>
        `
        const $video = $section.querySelector('.video')
        const $playButton = $section.querySelector('.play-button')

        const togglePlay = ev => {
            if (ev.type === 'touchend' && $video.paused) return
            ev.preventDefault()
            $video.paused ? $video.play() : $video.pause()
        }
        $section.addEventListener('touchend', togglePlay)
        $section.addEventListener('click', togglePlay)

        const videoToggle = () => {
            $section.classList.toggle('playing', !$video.paused)
            $playButton.classList.toggle('pause-button', !$video.paused)
            $video.controls = !$video.paused
        }
        $video.addEventListener('pause', videoToggle)
        $video.addEventListener('ended', videoToggle)
        $video.addEventListener('play', videoToggle)
    })

})()