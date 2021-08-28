import React, { useState, useEffect, createContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = createContext()

const GithubProvider = ({children}) => {
    const [githubUser, setGithubUser] = useState(mockUser)
    const [githubRepos, setGithubRepos] = useState(mockRepos)
    const [githubFollowers, setGithubFollowers] = useState(mockFollowers)
    const [requests, setRequests] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState({show: false, msg: ''})

    const searchGithubUser = async(user)=> {
        toggleError()
        setLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`)
        .catch(err => console.log(err))
        if (response) {
            setGithubUser(response.data)
            const {login, followers_url} = response.data
            await Promise.allSettled([axios(`${rootUrl}/users/${login}/repos?per_page=100`),axios(`${followers_url}?per_page=100`)])
            .then(results => {
                const[repos, followers] = results
                const status = 'fulfilled'
                if (repos.status === status) {
                    setGithubRepos(repos.value.data)
                }
                if (followers.status === status) {
                    setGithubFollowers(followers.value.data)
                }
            })
        } else {
            toggleError(true, 'there is no user with that username')
        }
        checkRequests()
        setLoading(false)
    }

    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`).then(({data}) => {
            let {rate: {remaining}} = data
            setRequests(remaining)
            if (remaining === 0) {
                toggleError(true, 'sorry you have exceeded your hourly limit')
            }
        })
        .catch(err => console.log(err))
    }

    function toggleError(show = false, msg = '') {
        setError({show, msg})
    }

    useEffect(
        checkRequests
    , [])
    return <GithubContext.Provider value={{githubUser, githubRepos, githubFollowers, requests, searchGithubUser, loading, setLoading, error}}>
        {children}
    </GithubContext.Provider>
}

export {GithubProvider, GithubContext}
