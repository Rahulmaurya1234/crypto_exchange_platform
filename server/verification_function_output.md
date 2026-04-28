verification\_function ka output structure\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*





=> jo escrow verification function hoga, uske output me kuch cases honge, unhi cases ke base pe further action lena hoga. output me "status"field hogi, jiske {-1,0,1,2,3} options hae and "valid" field hogi, jiske options hae: {true, ya false} ( iska exact implementation change karwaya jaa skta hae as per need , but core working same hogi ) 



=> inhi status and valid ke different combinations se different cases honge, jiske base pe outer system ko appropriate action lena hoga.



=> case1st: output me status :-1, valid : false ( status -1 ke case me valid : true nhi ayega ). is case ka mtlb block-chain pe data mila hi nhi saare attempts kar lene ke baad bhi. outer system ke liye is code ka mtlb hae ki ab aage transaction nhi hogi, user ne jo info feed ki hae, vo wrong hae, and iske baad simply koi retries nhi karni, exit kar jana hae. and users ko notify kar dena hae.



=> case2nd: output me status: 0, valid: false ( is status me bhi valid: true nhi ayega). is case ka mtlb txn abhi pending hae, user ko notify karna hae ki txn abhi pending state me hae. ye code milne par low frequency me is function ko dobara call krna hae until code change na ho jay. 



\*/ case2nd ke baad fixed case3rd hi aata hae, dusra kuch possible nhi hae \*/



=> case3rd: output me status: 1, valid: false ( isme bhi valid: true nhi ayega ), is case ka mtlb ki seller se txn ho gyi hae, but abhi escrow ke wallet me aayi nhi hae as proper confirmation chal rhi hae. ( ye case ye mostly prove kar deta hae ki seller ke side se fraudulent case nhi hae, but still seller se absent minded mistake, ya other cases me failure possible hae. ) since is case me seller ke through fraud ka case very less likely ho jata hae, hm users ko appropriate notification de skte hae. and is case ke baad successful hone ke chances high hote hae. is code ke milne ke baad bhi normal frequency me is function ko call karna hae until iske baad ke possible cases me se koi ek na mil jay.



\*/ case 3 ke baad three different cases possible ho skte hae, case 4, case 5, case 6, ye all three possible ho skte hae, and ye all three ending cases hae, unme se kisi ek ke bhi aane ke baad again function call ki need nhi hogi \*/



=> case 4th: status: 2, valid: false ( isme bhi same valid: true nhi ayega ) 



is case ka mtlb txn failed , escrow ke wallet me crypto nhi ayi and ab current trade and txnHash ke respect se ayegi bhi nhi, yha par stop and exit condition hae, user ko notify kar dena hae. is case ka mtlb ye ki user ne txn kiya tha, but apne wallet me nhi aayi , and ayegi bhi nhi, is case me refund etc ki responsibility escrow nhi lega as escrow ke paas crypto aayi hi nhi ! 



=> case 5th: status: 3, valid: true 



is case ka mtlb ki sab properly ho gya, properly escrow ko crypto mil gyi and txn verify ho gya, ab simply buyer se amount ( real money ) lene  ka process start kiya ja skta hae. 



=> case 6th: status: 4, valid: false



is case ka mtlb txn hui hae, crypto aayi hae, but kuch problem ho gyi hae. two sub cases possible. 

&#x09;\*1st: required amount nhi aayi , kam aayi hae, 

&#x09;\*2nd: cryptoType mismatch hogya hae. 





\---------------------------------------------------------------------





=> start to end agar failure cases remove kar de, to usually pura process 2 mins to 10 mins ke ander ho jana chahiye. ye different cryptoTypes pe change hota rhta hae, so timing agar hogi to rigid nhi honi chahiye.



=> status 0 to status 1 hone me usually 5 to 30 or 40 seconds approx lgte hae. 



=> status 1 to further kisi bhi cases me usually 5 mins to 10mins ke approx lag skta hae, ye crypto type ke according change hota h , isme time lagta hae, so user ko uske according kya show karna hae, vo manage karna hoga. 



=> ( ye timing ahi guaranteed confirm nhi hae, abhi is per test ho rha hae. )

