FROM hseeberger/scala-sbt

# Derived from haskell and jagregory/pandoc 

## Install Haskell
ENV LANG            C.UTF-8

RUN echo 'deb http://ppa.launchpad.net/hvr/ghc/ubuntu trusty main' > /etc/apt/sources.list.d/ghc.list && \
    echo 'deb http://download.fpcomplete.com/debian/jessie stable main'| tee /etc/apt/sources.list.d/fpco.list && \
    # hvr keys
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys F6F88286 && \
    # fpco keys
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C5705533DA4F78D8664B5DC0575159689BEFB442 && \
    apt-get update && \
    apt-get install -y --no-install-recommends cabal-install-1.22 ghc-7.10.3 happy-1.19.5 alex-3.1.4 \
            stack zlib1g-dev libtinfo-dev libsqlite3-0 libsqlite3-dev ca-certificates g++ && \
    rm -rf /var/lib/apt/lists/*

ENV PATH /root/.cabal/bin:/root/.local/bin:/opt/cabal/1.22/bin:/opt/ghc/7.10.3/bin:/opt/happy/1.19.5/bin:/opt/alex/3.1.4/bin:$PATH


## Install Pandoc
ENV PANDOC_VERSION "1.16.0.2"

RUN cabal update && cabal install pandoc-${PANDOC_VERSION} && cabal install pandoc-crossref

## Install Latex and fonts
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-xetex latex-xcolor \
    texlive-math-extra \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-bibtex-extra \
    lmodern \
    ttf-bitstream-vera \
    fontconfig


## Install Node
RUN curl -sL https://deb.nodesource.com/setup_5.x | bash - && \
    apt-get install -y nodejs

## Install Grunt
RUN npm install -g grunt-cli

## Install Coffeescript
RUN npm install -g coffee-script

WORKDIR /source
